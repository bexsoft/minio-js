"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
class CopyConditions {
  modified = '';
  unmodified = '';
  matchETag = '';
  matchETagExcept = '';
  setModified(date) {
    if (!(date instanceof Date)) {
      throw new TypeError('date must be of type Date');
    }
    this.modified = date.toUTCString();
  }
  setUnmodified(date) {
    if (!(date instanceof Date)) {
      throw new TypeError('date must be of type Date');
    }
    this.unmodified = date.toUTCString();
  }
  setMatchETag(etag) {
    this.matchETag = etag;
  }
  setMatchETagExcept(etag) {
    this.matchETagExcept = etag;
  }
}
exports.CopyConditions = CopyConditions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDb3B5Q29uZGl0aW9ucyIsIm1vZGlmaWVkIiwidW5tb2RpZmllZCIsIm1hdGNoRVRhZyIsIm1hdGNoRVRhZ0V4Y2VwdCIsInNldE1vZGlmaWVkIiwiZGF0ZSIsIkRhdGUiLCJUeXBlRXJyb3IiLCJ0b1VUQ1N0cmluZyIsInNldFVubW9kaWZpZWQiLCJzZXRNYXRjaEVUYWciLCJldGFnIiwic2V0TWF0Y2hFVGFnRXhjZXB0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbImNvcHktY29uZGl0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgQ29weUNvbmRpdGlvbnMge1xuICBwdWJsaWMgbW9kaWZpZWQgPSAnJ1xuICBwdWJsaWMgdW5tb2RpZmllZCA9ICcnXG4gIHB1YmxpYyBtYXRjaEVUYWcgPSAnJ1xuICBwdWJsaWMgbWF0Y2hFVGFnRXhjZXB0ID0gJydcblxuICBzZXRNb2RpZmllZChkYXRlOiBEYXRlKTogdm9pZCB7XG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdkYXRlIG11c3QgYmUgb2YgdHlwZSBEYXRlJylcbiAgICB9XG5cbiAgICB0aGlzLm1vZGlmaWVkID0gZGF0ZS50b1VUQ1N0cmluZygpXG4gIH1cblxuICBzZXRVbm1vZGlmaWVkKGRhdGU6IERhdGUpOiB2b2lkIHtcbiAgICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RhdGUgbXVzdCBiZSBvZiB0eXBlIERhdGUnKVxuICAgIH1cblxuICAgIHRoaXMudW5tb2RpZmllZCA9IGRhdGUudG9VVENTdHJpbmcoKVxuICB9XG5cbiAgc2V0TWF0Y2hFVGFnKGV0YWc6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubWF0Y2hFVGFnID0gZXRhZ1xuICB9XG5cbiAgc2V0TWF0Y2hFVGFnRXhjZXB0KGV0YWc6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubWF0Y2hFVGFnRXhjZXB0ID0gZXRhZ1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7O0FBQU8sTUFBTUEsY0FBYyxDQUFDO0VBQ25CQyxRQUFRLEdBQUcsRUFBRTtFQUNiQyxVQUFVLEdBQUcsRUFBRTtFQUNmQyxTQUFTLEdBQUcsRUFBRTtFQUNkQyxlQUFlLEdBQUcsRUFBRTtFQUUzQkMsV0FBV0EsQ0FBQ0MsSUFBVSxFQUFRO0lBQzVCLElBQUksRUFBRUEsSUFBSSxZQUFZQyxJQUFJLENBQUMsRUFBRTtNQUMzQixNQUFNLElBQUlDLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQztJQUNsRDtJQUVBLElBQUksQ0FBQ1AsUUFBUSxHQUFHSyxJQUFJLENBQUNHLFdBQVcsQ0FBQyxDQUFDO0VBQ3BDO0VBRUFDLGFBQWFBLENBQUNKLElBQVUsRUFBUTtJQUM5QixJQUFJLEVBQUVBLElBQUksWUFBWUMsSUFBSSxDQUFDLEVBQUU7TUFDM0IsTUFBTSxJQUFJQyxTQUFTLENBQUMsMkJBQTJCLENBQUM7SUFDbEQ7SUFFQSxJQUFJLENBQUNOLFVBQVUsR0FBR0ksSUFBSSxDQUFDRyxXQUFXLENBQUMsQ0FBQztFQUN0QztFQUVBRSxZQUFZQSxDQUFDQyxJQUFZLEVBQVE7SUFDL0IsSUFBSSxDQUFDVCxTQUFTLEdBQUdTLElBQUk7RUFDdkI7RUFFQUMsa0JBQWtCQSxDQUFDRCxJQUFZLEVBQVE7SUFDckMsSUFBSSxDQUFDUixlQUFlLEdBQUdRLElBQUk7RUFDN0I7QUFDRjtBQUFDRSxPQUFBLENBQUFkLGNBQUEsR0FBQUEsY0FBQSJ9