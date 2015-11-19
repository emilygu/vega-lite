/// <reference path="../../typings/d3-time-format.d.ts"/>

import {utcFormat} from 'd3-time-format';

import Encoding from '../Encoding';
import * as vlFieldDef from '../fielddef';
import * as util from '../util';
import {Enctype, Type} from '../consts';

// 'Wednesday September 17 04:00:00 2014'
// Wednesday is the longest date
// September is the longest month (8 in javascript as it is zero-indexed).
const LONG_DATE = new Date(Date.UTC(2014, 8, 17));

export function cardinality(fieldDef, stats, filterNull, type) {
  var timeUnit = fieldDef.timeUnit;
  switch (timeUnit) {
    case 'seconds': return 60;
    case 'minutes': return 60;
    case 'hours': return 24;
    case 'day': return 7;
    case 'date': return 31;
    case 'month': return 12;
    case 'year':
      var stat = stats[fieldDef.name],
        yearstat = stats['year_' + fieldDef.name];

      if (!yearstat) { return null; }

      return yearstat.distinct -
        (stat.missing > 0 && filterNull[type] ? 1 : 0);
  }

  return null;
}

export function formula(timeUnit, fieldRef) {
  // TODO(kanitw): add formula to other time format
  var fn = 'utc' + timeUnit;
  return fn + '(' + fieldRef + ')';
}

export function maxLength(fieldDef, encoding: Encoding) {
  switch (fieldDef.timeUnit) {
    case 'seconds':
    case 'minutes':
    case 'hours':
    case 'date':
      return 2;
    case 'month':
      // FIXME: find the actual legth of the longest month
      if (fieldDef.axis.shortTimeNames)
        return 3;
      return 9;
    case 'day':
      // FIXME: find the actual length of the longest day of the week
      if (fieldDef.axis.shortTimeNames)
        return 3;
      return 9;
    case 'year':
      return 4; //'1998'
  }
  // TODO(#600) revise this
  // no time unit
  var timeFormat = encoding.config('timeFormat');
  return utcFormat(timeFormat)(LONG_DATE).length;
}

export function range(timeUnit, encoding: Encoding) {
  var labelLength = encoding.config('timeScaleLabelLength'),
    scaleLabel;
  switch (timeUnit) {
    case 'day':
      scaleLabel = encoding.config('dayScaleLabel');
      break;
    case 'month':
      scaleLabel = encoding.config('monthScaleLabel');
      break;
  }
  if (scaleLabel) {
    return labelLength ? scaleLabel.map(
        function(s) { return s.substr(0, labelLength);}
      ) : scaleLabel;
  }
  return;
}


export function isOrdinalFn(timeUnit) {
  switch (timeUnit) {
    case 'seconds':
    case 'minutes':
    case 'hours':
    case 'day':
    case 'date':
    case 'month':
      return true;
  }
  return false;
}


export namespace scale {
  export function type(timeUnit, name) {
    if (name === Enctype.COLOR) {
      return 'linear'; // time has order, so use interpolated ordinal color scale.
    }

    // FIXME revise this -- should 'year' be linear too?
    return isOrdinalFn(timeUnit) || name === Enctype.COL || name === Enctype.ROW ? 'ordinal' : 'linear';
  }

  export function domain(timeUnit, name?) {
    var isColor = name === Enctype.COLOR;
    switch (timeUnit) {
      case 'seconds':
      case 'minutes': return isColor ? [0,59] : util.range(0, 60);
      case 'hours': return isColor ? [0,23] : util.range(0, 24);
      case 'day': return isColor ? [0,6] : util.range(0, 7);
      case 'date': return isColor ? [1,31] : util.range(1, 32);
      case 'month': return isColor ? [0,11] : util.range(0, 12);
    }
    return null;
  }
}

/** returns the template name used for axis labels for a time unit */
export function labelTemplate(timeUnit) : string {
  switch (timeUnit) {
    case 'day':
      return 'weekday';
    case 'month':
      return 'month';
  }
  return null;
}
