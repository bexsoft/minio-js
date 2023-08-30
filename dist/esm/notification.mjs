/*
 * MinIO Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2016 MinIO, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventEmitter } from "events";
import { DEFAULT_REGION } from "./helpers.mjs";
import { pipesetup, uriEscape } from "./internal/helper.mjs";
import * as transformers from "./transformers.mjs";

// Notification config - array of target configs.
// Target configs can be
// 1. Topic (simple notification service)
// 2. Queue (simple queue service)
// 3. CloudFront (lambda function)
export class NotificationConfig {
  add(target) {
    let instance = '';
    if (target instanceof TopicConfig) {
      instance = 'TopicConfiguration';
    }
    if (target instanceof QueueConfig) {
      instance = 'QueueConfiguration';
    }
    if (target instanceof CloudFunctionConfig) {
      instance = 'CloudFunctionConfiguration';
    }
    if (!this[instance]) {
      this[instance] = [];
    }
    this[instance].push(target);
  }
}

// Base class for three supported configs.
class TargetConfig {
  setId(id) {
    this.Id = id;
  }
  addEvent(newevent) {
    if (!this.Event) {
      this.Event = [];
    }
    this.Event.push(newevent);
  }
  addFilterSuffix(suffix) {
    if (!this.Filter) {
      this.Filter = {
        S3Key: {
          FilterRule: []
        }
      };
    }
    this.Filter.S3Key.FilterRule.push({
      Name: 'suffix',
      Value: suffix
    });
  }
  addFilterPrefix(prefix) {
    if (!this.Filter) {
      this.Filter = {
        S3Key: {
          FilterRule: []
        }
      };
    }
    this.Filter.S3Key.FilterRule.push({
      Name: 'prefix',
      Value: prefix
    });
  }
}

// 1. Topic (simple notification service)
export class TopicConfig extends TargetConfig {
  constructor(arn) {
    super();
    this.Topic = arn;
  }
}

// 2. Queue (simple queue service)
export class QueueConfig extends TargetConfig {
  constructor(arn) {
    super();
    this.Queue = arn;
  }
}

// 3. CloudFront (lambda function)
export class CloudFunctionConfig extends TargetConfig {
  constructor(arn) {
    super();
    this.CloudFunction = arn;
  }
}
export const buildARN = (partition, service, region, accountId, resource) => {
  return 'arn:' + partition + ':' + service + ':' + region + ':' + accountId + ':' + resource;
};
export const ObjectCreatedAll = 's3:ObjectCreated:*';
export const ObjectCreatedPut = 's3:ObjectCreated:Put';
export const ObjectCreatedPost = 's3:ObjectCreated:Post';
export const ObjectCreatedCopy = 's3:ObjectCreated:Copy';
export const ObjectCreatedCompleteMultipartUpload = 's3:ObjectCreated:CompleteMultipartUpload';
export const ObjectRemovedAll = 's3:ObjectRemoved:*';
export const ObjectRemovedDelete = 's3:ObjectRemoved:Delete';
export const ObjectRemovedDeleteMarkerCreated = 's3:ObjectRemoved:DeleteMarkerCreated';
export const ObjectReducedRedundancyLostObject = 's3:ReducedRedundancyLostObject';

// Poll for notifications, used in #listenBucketNotification.
// Listening constitutes repeatedly requesting s3 whether or not any
// changes have occurred.
export class NotificationPoller extends EventEmitter {
  constructor(client, bucketName, prefix, suffix, events) {
    super();
    this.client = client;
    this.bucketName = bucketName;
    this.prefix = prefix;
    this.suffix = suffix;
    this.events = events;
    this.ending = false;
  }

  // Starts the polling.
  start() {
    this.ending = false;
    process.nextTick(() => {
      this.checkForChanges();
    });
  }

  // Stops the polling.
  stop() {
    this.ending = true;
  }
  checkForChanges() {
    // Don't continue if we're looping again but are cancelled.
    if (this.ending) {
      return;
    }
    let method = 'GET';
    var queries = [];
    if (this.prefix) {
      var prefix = uriEscape(this.prefix);
      queries.push(`prefix=${prefix}`);
    }
    if (this.suffix) {
      var suffix = uriEscape(this.suffix);
      queries.push(`suffix=${suffix}`);
    }
    if (this.events) {
      this.events.forEach(s3event => queries.push('events=' + uriEscape(s3event)));
    }
    queries.sort();
    var query = '';
    if (queries.length > 0) {
      query = `${queries.join('&')}`;
    }
    const region = this.client.region || DEFAULT_REGION;
    this.client.makeRequest({
      method,
      bucketName: this.bucketName,
      query
    }, '', [200], region, true, (e, response) => {
      if (e) {
        return this.emit('error', e);
      }
      let transformer = transformers.getNotificationTransformer();
      pipesetup(response, transformer).on('data', result => {
        // Data is flushed periodically (every 5 seconds), so we should
        // handle it after flushing from the JSON parser.
        let records = result.Records;
        // If null (= no records), change to an empty array.
        if (!records) {
          records = [];
        }

        // Iterate over the notifications and emit them individually.
        records.forEach(record => {
          this.emit('notification', record);
        });

        // If we're done, stop.
        if (this.ending) {
          response.destroy();
        }
      }).on('error', e => this.emit('error', e)).on('end', () => {
        // Do it again, if we haven't cancelled yet.
        process.nextTick(() => {
          this.checkForChanges();
        });
      });
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFdmVudEVtaXR0ZXIiLCJERUZBVUxUX1JFR0lPTiIsInBpcGVzZXR1cCIsInVyaUVzY2FwZSIsInRyYW5zZm9ybWVycyIsIk5vdGlmaWNhdGlvbkNvbmZpZyIsImFkZCIsInRhcmdldCIsImluc3RhbmNlIiwiVG9waWNDb25maWciLCJRdWV1ZUNvbmZpZyIsIkNsb3VkRnVuY3Rpb25Db25maWciLCJwdXNoIiwiVGFyZ2V0Q29uZmlnIiwic2V0SWQiLCJpZCIsIklkIiwiYWRkRXZlbnQiLCJuZXdldmVudCIsIkV2ZW50IiwiYWRkRmlsdGVyU3VmZml4Iiwic3VmZml4IiwiRmlsdGVyIiwiUzNLZXkiLCJGaWx0ZXJSdWxlIiwiTmFtZSIsIlZhbHVlIiwiYWRkRmlsdGVyUHJlZml4IiwicHJlZml4IiwiY29uc3RydWN0b3IiLCJhcm4iLCJUb3BpYyIsIlF1ZXVlIiwiQ2xvdWRGdW5jdGlvbiIsImJ1aWxkQVJOIiwicGFydGl0aW9uIiwic2VydmljZSIsInJlZ2lvbiIsImFjY291bnRJZCIsInJlc291cmNlIiwiT2JqZWN0Q3JlYXRlZEFsbCIsIk9iamVjdENyZWF0ZWRQdXQiLCJPYmplY3RDcmVhdGVkUG9zdCIsIk9iamVjdENyZWF0ZWRDb3B5IiwiT2JqZWN0Q3JlYXRlZENvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkIiwiT2JqZWN0UmVtb3ZlZEFsbCIsIk9iamVjdFJlbW92ZWREZWxldGUiLCJPYmplY3RSZW1vdmVkRGVsZXRlTWFya2VyQ3JlYXRlZCIsIk9iamVjdFJlZHVjZWRSZWR1bmRhbmN5TG9zdE9iamVjdCIsIk5vdGlmaWNhdGlvblBvbGxlciIsImNsaWVudCIsImJ1Y2tldE5hbWUiLCJldmVudHMiLCJlbmRpbmciLCJzdGFydCIsInByb2Nlc3MiLCJuZXh0VGljayIsImNoZWNrRm9yQ2hhbmdlcyIsInN0b3AiLCJtZXRob2QiLCJxdWVyaWVzIiwiZm9yRWFjaCIsInMzZXZlbnQiLCJzb3J0IiwicXVlcnkiLCJsZW5ndGgiLCJqb2luIiwibWFrZVJlcXVlc3QiLCJlIiwicmVzcG9uc2UiLCJlbWl0IiwidHJhbnNmb3JtZXIiLCJnZXROb3RpZmljYXRpb25UcmFuc2Zvcm1lciIsIm9uIiwicmVzdWx0IiwicmVjb3JkcyIsIlJlY29yZHMiLCJyZWNvcmQiLCJkZXN0cm95Il0sInNvdXJjZXMiOlsibm90aWZpY2F0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaW5JTyBKYXZhc2NyaXB0IExpYnJhcnkgZm9yIEFtYXpvbiBTMyBDb21wYXRpYmxlIENsb3VkIFN0b3JhZ2UsIChDKSAyMDE2IE1pbklPLCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ25vZGU6ZXZlbnRzJ1xuXG5pbXBvcnQgeyBERUZBVUxUX1JFR0lPTiB9IGZyb20gJy4vaGVscGVycy50cydcbmltcG9ydCB7IHBpcGVzZXR1cCwgdXJpRXNjYXBlIH0gZnJvbSAnLi9pbnRlcm5hbC9oZWxwZXIudHMnXG5pbXBvcnQgKiBhcyB0cmFuc2Zvcm1lcnMgZnJvbSAnLi90cmFuc2Zvcm1lcnMuanMnXG5cbi8vIE5vdGlmaWNhdGlvbiBjb25maWcgLSBhcnJheSBvZiB0YXJnZXQgY29uZmlncy5cbi8vIFRhcmdldCBjb25maWdzIGNhbiBiZVxuLy8gMS4gVG9waWMgKHNpbXBsZSBub3RpZmljYXRpb24gc2VydmljZSlcbi8vIDIuIFF1ZXVlIChzaW1wbGUgcXVldWUgc2VydmljZSlcbi8vIDMuIENsb3VkRnJvbnQgKGxhbWJkYSBmdW5jdGlvbilcbmV4cG9ydCBjbGFzcyBOb3RpZmljYXRpb25Db25maWcge1xuICBhZGQodGFyZ2V0KSB7XG4gICAgbGV0IGluc3RhbmNlID0gJydcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVG9waWNDb25maWcpIHtcbiAgICAgIGluc3RhbmNlID0gJ1RvcGljQ29uZmlndXJhdGlvbidcbiAgICB9XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFF1ZXVlQ29uZmlnKSB7XG4gICAgICBpbnN0YW5jZSA9ICdRdWV1ZUNvbmZpZ3VyYXRpb24nXG4gICAgfVxuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBDbG91ZEZ1bmN0aW9uQ29uZmlnKSB7XG4gICAgICBpbnN0YW5jZSA9ICdDbG91ZEZ1bmN0aW9uQ29uZmlndXJhdGlvbidcbiAgICB9XG4gICAgaWYgKCF0aGlzW2luc3RhbmNlXSkge1xuICAgICAgdGhpc1tpbnN0YW5jZV0gPSBbXVxuICAgIH1cbiAgICB0aGlzW2luc3RhbmNlXS5wdXNoKHRhcmdldClcbiAgfVxufVxuXG4vLyBCYXNlIGNsYXNzIGZvciB0aHJlZSBzdXBwb3J0ZWQgY29uZmlncy5cbmNsYXNzIFRhcmdldENvbmZpZyB7XG4gIHNldElkKGlkKSB7XG4gICAgdGhpcy5JZCA9IGlkXG4gIH1cbiAgYWRkRXZlbnQobmV3ZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuRXZlbnQpIHtcbiAgICAgIHRoaXMuRXZlbnQgPSBbXVxuICAgIH1cbiAgICB0aGlzLkV2ZW50LnB1c2gobmV3ZXZlbnQpXG4gIH1cbiAgYWRkRmlsdGVyU3VmZml4KHN1ZmZpeCkge1xuICAgIGlmICghdGhpcy5GaWx0ZXIpIHtcbiAgICAgIHRoaXMuRmlsdGVyID0geyBTM0tleTogeyBGaWx0ZXJSdWxlOiBbXSB9IH1cbiAgICB9XG4gICAgdGhpcy5GaWx0ZXIuUzNLZXkuRmlsdGVyUnVsZS5wdXNoKHsgTmFtZTogJ3N1ZmZpeCcsIFZhbHVlOiBzdWZmaXggfSlcbiAgfVxuICBhZGRGaWx0ZXJQcmVmaXgocHJlZml4KSB7XG4gICAgaWYgKCF0aGlzLkZpbHRlcikge1xuICAgICAgdGhpcy5GaWx0ZXIgPSB7IFMzS2V5OiB7IEZpbHRlclJ1bGU6IFtdIH0gfVxuICAgIH1cbiAgICB0aGlzLkZpbHRlci5TM0tleS5GaWx0ZXJSdWxlLnB1c2goeyBOYW1lOiAncHJlZml4JywgVmFsdWU6IHByZWZpeCB9KVxuICB9XG59XG5cbi8vIDEuIFRvcGljIChzaW1wbGUgbm90aWZpY2F0aW9uIHNlcnZpY2UpXG5leHBvcnQgY2xhc3MgVG9waWNDb25maWcgZXh0ZW5kcyBUYXJnZXRDb25maWcge1xuICBjb25zdHJ1Y3Rvcihhcm4pIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5Ub3BpYyA9IGFyblxuICB9XG59XG5cbi8vIDIuIFF1ZXVlIChzaW1wbGUgcXVldWUgc2VydmljZSlcbmV4cG9ydCBjbGFzcyBRdWV1ZUNvbmZpZyBleHRlbmRzIFRhcmdldENvbmZpZyB7XG4gIGNvbnN0cnVjdG9yKGFybikge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLlF1ZXVlID0gYXJuXG4gIH1cbn1cblxuLy8gMy4gQ2xvdWRGcm9udCAobGFtYmRhIGZ1bmN0aW9uKVxuZXhwb3J0IGNsYXNzIENsb3VkRnVuY3Rpb25Db25maWcgZXh0ZW5kcyBUYXJnZXRDb25maWcge1xuICBjb25zdHJ1Y3Rvcihhcm4pIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5DbG91ZEZ1bmN0aW9uID0gYXJuXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGJ1aWxkQVJOID0gKHBhcnRpdGlvbiwgc2VydmljZSwgcmVnaW9uLCBhY2NvdW50SWQsIHJlc291cmNlKSA9PiB7XG4gIHJldHVybiAnYXJuOicgKyBwYXJ0aXRpb24gKyAnOicgKyBzZXJ2aWNlICsgJzonICsgcmVnaW9uICsgJzonICsgYWNjb3VudElkICsgJzonICsgcmVzb3VyY2Vcbn1cblxuZXhwb3J0IGNvbnN0IE9iamVjdENyZWF0ZWRBbGwgPSAnczM6T2JqZWN0Q3JlYXRlZDoqJ1xuZXhwb3J0IGNvbnN0IE9iamVjdENyZWF0ZWRQdXQgPSAnczM6T2JqZWN0Q3JlYXRlZDpQdXQnXG5leHBvcnQgY29uc3QgT2JqZWN0Q3JlYXRlZFBvc3QgPSAnczM6T2JqZWN0Q3JlYXRlZDpQb3N0J1xuZXhwb3J0IGNvbnN0IE9iamVjdENyZWF0ZWRDb3B5ID0gJ3MzOk9iamVjdENyZWF0ZWQ6Q29weSdcbmV4cG9ydCBjb25zdCBPYmplY3RDcmVhdGVkQ29tcGxldGVNdWx0aXBhcnRVcGxvYWQgPSAnczM6T2JqZWN0Q3JlYXRlZDpDb21wbGV0ZU11bHRpcGFydFVwbG9hZCdcbmV4cG9ydCBjb25zdCBPYmplY3RSZW1vdmVkQWxsID0gJ3MzOk9iamVjdFJlbW92ZWQ6KidcbmV4cG9ydCBjb25zdCBPYmplY3RSZW1vdmVkRGVsZXRlID0gJ3MzOk9iamVjdFJlbW92ZWQ6RGVsZXRlJ1xuZXhwb3J0IGNvbnN0IE9iamVjdFJlbW92ZWREZWxldGVNYXJrZXJDcmVhdGVkID0gJ3MzOk9iamVjdFJlbW92ZWQ6RGVsZXRlTWFya2VyQ3JlYXRlZCdcbmV4cG9ydCBjb25zdCBPYmplY3RSZWR1Y2VkUmVkdW5kYW5jeUxvc3RPYmplY3QgPSAnczM6UmVkdWNlZFJlZHVuZGFuY3lMb3N0T2JqZWN0J1xuXG4vLyBQb2xsIGZvciBub3RpZmljYXRpb25zLCB1c2VkIGluICNsaXN0ZW5CdWNrZXROb3RpZmljYXRpb24uXG4vLyBMaXN0ZW5pbmcgY29uc3RpdHV0ZXMgcmVwZWF0ZWRseSByZXF1ZXN0aW5nIHMzIHdoZXRoZXIgb3Igbm90IGFueVxuLy8gY2hhbmdlcyBoYXZlIG9jY3VycmVkLlxuZXhwb3J0IGNsYXNzIE5vdGlmaWNhdGlvblBvbGxlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgYnVja2V0TmFtZSwgcHJlZml4LCBzdWZmaXgsIGV2ZW50cykge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50XG4gICAgdGhpcy5idWNrZXROYW1lID0gYnVja2V0TmFtZVxuICAgIHRoaXMucHJlZml4ID0gcHJlZml4XG4gICAgdGhpcy5zdWZmaXggPSBzdWZmaXhcbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50c1xuXG4gICAgdGhpcy5lbmRpbmcgPSBmYWxzZVxuICB9XG5cbiAgLy8gU3RhcnRzIHRoZSBwb2xsaW5nLlxuICBzdGFydCgpIHtcbiAgICB0aGlzLmVuZGluZyA9IGZhbHNlXG5cbiAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgIHRoaXMuY2hlY2tGb3JDaGFuZ2VzKClcbiAgICB9KVxuICB9XG5cbiAgLy8gU3RvcHMgdGhlIHBvbGxpbmcuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5lbmRpbmcgPSB0cnVlXG4gIH1cblxuICBjaGVja0ZvckNoYW5nZXMoKSB7XG4gICAgLy8gRG9uJ3QgY29udGludWUgaWYgd2UncmUgbG9vcGluZyBhZ2FpbiBidXQgYXJlIGNhbmNlbGxlZC5cbiAgICBpZiAodGhpcy5lbmRpbmcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxldCBtZXRob2QgPSAnR0VUJ1xuICAgIHZhciBxdWVyaWVzID0gW11cbiAgICBpZiAodGhpcy5wcmVmaXgpIHtcbiAgICAgIHZhciBwcmVmaXggPSB1cmlFc2NhcGUodGhpcy5wcmVmaXgpXG4gICAgICBxdWVyaWVzLnB1c2goYHByZWZpeD0ke3ByZWZpeH1gKVxuICAgIH1cbiAgICBpZiAodGhpcy5zdWZmaXgpIHtcbiAgICAgIHZhciBzdWZmaXggPSB1cmlFc2NhcGUodGhpcy5zdWZmaXgpXG4gICAgICBxdWVyaWVzLnB1c2goYHN1ZmZpeD0ke3N1ZmZpeH1gKVxuICAgIH1cbiAgICBpZiAodGhpcy5ldmVudHMpIHtcbiAgICAgIHRoaXMuZXZlbnRzLmZvckVhY2goKHMzZXZlbnQpID0+IHF1ZXJpZXMucHVzaCgnZXZlbnRzPScgKyB1cmlFc2NhcGUoczNldmVudCkpKVxuICAgIH1cbiAgICBxdWVyaWVzLnNvcnQoKVxuXG4gICAgdmFyIHF1ZXJ5ID0gJydcbiAgICBpZiAocXVlcmllcy5sZW5ndGggPiAwKSB7XG4gICAgICBxdWVyeSA9IGAke3F1ZXJpZXMuam9pbignJicpfWBcbiAgICB9XG4gICAgY29uc3QgcmVnaW9uID0gdGhpcy5jbGllbnQucmVnaW9uIHx8IERFRkFVTFRfUkVHSU9OXG4gICAgdGhpcy5jbGllbnQubWFrZVJlcXVlc3QoeyBtZXRob2QsIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0TmFtZSwgcXVlcnkgfSwgJycsIFsyMDBdLCByZWdpb24sIHRydWUsIChlLCByZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1pdCgnZXJyb3InLCBlKVxuICAgICAgfVxuXG4gICAgICBsZXQgdHJhbnNmb3JtZXIgPSB0cmFuc2Zvcm1lcnMuZ2V0Tm90aWZpY2F0aW9uVHJhbnNmb3JtZXIoKVxuICAgICAgcGlwZXNldHVwKHJlc3BvbnNlLCB0cmFuc2Zvcm1lcilcbiAgICAgICAgLm9uKCdkYXRhJywgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgIC8vIERhdGEgaXMgZmx1c2hlZCBwZXJpb2RpY2FsbHkgKGV2ZXJ5IDUgc2Vjb25kcyksIHNvIHdlIHNob3VsZFxuICAgICAgICAgIC8vIGhhbmRsZSBpdCBhZnRlciBmbHVzaGluZyBmcm9tIHRoZSBKU09OIHBhcnNlci5cbiAgICAgICAgICBsZXQgcmVjb3JkcyA9IHJlc3VsdC5SZWNvcmRzXG4gICAgICAgICAgLy8gSWYgbnVsbCAoPSBubyByZWNvcmRzKSwgY2hhbmdlIHRvIGFuIGVtcHR5IGFycmF5LlxuICAgICAgICAgIGlmICghcmVjb3Jkcykge1xuICAgICAgICAgICAgcmVjb3JkcyA9IFtdXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBub3RpZmljYXRpb25zIGFuZCBlbWl0IHRoZW0gaW5kaXZpZHVhbGx5LlxuICAgICAgICAgIHJlY29yZHMuZm9yRWFjaCgocmVjb3JkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ25vdGlmaWNhdGlvbicsIHJlY29yZClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgLy8gSWYgd2UncmUgZG9uZSwgc3RvcC5cbiAgICAgICAgICBpZiAodGhpcy5lbmRpbmcpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRlc3Ryb3koKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdlcnJvcicsIChlKSA9PiB0aGlzLmVtaXQoJ2Vycm9yJywgZSkpXG4gICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgIC8vIERvIGl0IGFnYWluLCBpZiB3ZSBoYXZlbid0IGNhbmNlbGxlZCB5ZXQuXG4gICAgICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrRm9yQ2hhbmdlcygpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9KVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxZQUFZO0FBRXJCLFNBQVNDLGNBQWMsUUFBUSxlQUFjO0FBQzdDLFNBQVNDLFNBQVMsRUFBRUMsU0FB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