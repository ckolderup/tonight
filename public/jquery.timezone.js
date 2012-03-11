/**
 * jQuery timezone plugin
 * @version: 1.0
 * @author: Brent Panther
 * @website: 
 * @copyright: 2011 Brent Panther
 * @license: 
 *
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>. 
 *
 * Usage:
 *
 * $('div').timezone();
 *
 * Options:
 *
 * tz: string The timezone to convert to. (e.g. 'EST', 'Eastern Standard Time')
 * pageOffset: number The UTC offset of the time originally on the page
 * pageTz: string The timezone of the times originally on the page (e.g. 'EST', 'Eastern Standard Time') 
 * format: string  A string format for the output time
 * callback: function  A callback function, containing offset, abbreviation ('abbr'), and name. 
 *
 * You must include this file and a version of the date.js JavaScript date library, found at:
 * http://www.datejs.com/googlecode
 * 
 */
(function($) {

    $.fn.timezone = function(options) {
		var opts = $.extend({}, $.fn.timezone.defaults, options);
		var localTimezone;
		var localOffset;
		var pageTimezone = timezones['0:UTC'];
		var pageOffset = 0;	
		var all = this.each(function() {
			var date = getDate($(this));
			//get local timezone information
            if(opts.tz) {
                localTimezone = getTzByAbbr(opts.tz);
                localOffset = getTzByDateAndAbbr(date, localTimezone).offset;
		    } else {
		        localTimezone = getLocalTimezone(date);
		        localOffset = localTimezone.offset;
		    }
		    //get page timezone information
		    if(opts.pageTz) {
		        pageTimezone = getTzByAbbr(opts.pageTz);
		        pageOffset = getTzByDateAndAbbr(date, pageTimezone).offset;
		    } else if(opts.pageOffset){
		        pageTimezone = opts.pageOffset;
		        pageOffset = opts.pageOffset;
		    } 
		    //put it together
		    date.addHours(localOffset - pageOffset);
			$(this).text(date.toString(opts.format));
		});
		if(typeof opts.callback == 'function' && all.length > 0){
            opts.callback.call(this, localTimezone, pageTimezone);
        }
		return all;
	};
	
	var getDate = function($el) {
	    var value = $el.data('tz-value');
		if(!value) {
			value = $el.text();
			$el.data('tz-value', $el.text());
		}		
		return Date.parse(value);
	}
	
	//based solely on abbreviation, get timezone
	var getTzByAbbr = function(abbr) {
	    for(var i in timezones) {
            if(timezones[i].abbr == abbr || timezones[i].name == abbr) { return timezones[i]; }
        }
	};
	
	//figure out timezone based on abbreviation and current date
	var getTzByDateAndAbbr = function(date, tz) {
		var abbr = tz.abbr;
	    var e = $.fn.timezone.times[abbr];
	    var undefined;
	    if(e===undefined) { 
	        return tz;
	        throw "Illegal argument. Unknown timezone: " + abbr; 
	    }
	    var isDST = date.between(get(e, 0), get(e, 1));
	    for(var i in timezones) {
	        var tz = timezones[i];
	        if(tz.isDST == isDST && (tz.standard.abbr == abbr || tz.abbr == abbr)) {
	            return tz;
	        }
	    }
	    for(i in timezones) {
		    if(timezones[i].abbr == abbr) { return timezones[i].standard;}
		}
	};
	
	var get = function(e, i) {
	     return Date.today().set({month: e[i][0], hour: e[i][1], minute: e[i][2]})
	        .moveToNthOccurrence(e[i][3],e[i][4]);
	};

	$.fn.timezone.defaults = {
		format: 'h:mm tt'
	};

    //get the user's local timezone based on browser
    //with opera, we can't tell what time zone they are using, only offset
    //since date.toString() doesnt return the timezone
    //so only use offset
	var getLocalTimezone = function(date) {
		var offset = -(date.getTimezoneOffset()/60);
	    var m = date.toString().match('\\((.+)\\)$') || date.toString().match('([A-Z]{3,}) [0-9]{4}$'); 
	    if(m===null) {
	        return {offset: offset};
	    }
		for(var i in timezones) {
		    var tz = timezones[i];
		    if((tz.offset == offset) && (tz.abbr == m[1] || tz.standard.abbr == m[1] 
		        || tz.standard.name == m[1] || tz.name == m[1])) {
		        return tz;
		    }
		}
	};
	
	function Timezone(offset, abbr, name, isDST) {
	    var undefined;
	    this.name = name;
	    this.offset = offset;
	    this.abbr = abbr;
	    this.hashCode = function() {
	        return offset + ':' + abbr;
	    };
	    this.standard = isDST ? undefined : this;
	    this.isDST = isDST;
	}
	
	function buildTimeZones(tz) {
	    var zones = {};
		var undefined;
	    for(var i in tz) {
			//offset, abbr, name, isDST, standard
	        var e = new Timezone(tz[i][0], tz[i][1], tz[i][2], tz[i][3]!==undefined);
	        zones[e.hashCode()] = e;
	    }
	    for(i in tz) {
	        if(tz[i][3]!==undefined) {
	            zones[tz[i][0] + ':' + tz[i][1]].standard = zones[tz[i][3]];
	        }
	    }
	    return zones;
	}
	
	var tz = [
		//offset, abbr, name, standard (if DST)
        [0, 'UTC', 'Coordinated Universal Time'],
        [0, 'GMT', 'Greenwich Mean Time'],
		//north america
        [-1, 'EGT', 'East Greenland Time'],
        [-3, 'WGT', 'West Greenland Time'],
        [-3, 'PMST', 'Pierre & Miquelon Standard Time'],
        [-3.5, 'NST', 'Newfoundland Standard Time'],
        [-4, 'AST', 'Atlantic Standard Time'],
        [-5, 'EST', 'Eastern Standard Time'],
        [-6, 'CST', 'Central Standard Time'],
        [-7, 'MST', 'Mountain Standard Time'],
        [-8, 'PST', 'Pacific Standard Time'],
        [-9, 'AKST', 'Alaska Standard Time'],
        [-10, 'HAST', 'Hawaii-Aleutian Standard Time'],
        [0, 'EGST', 'Eastern Greenland Summer Time', '-1:EGT'],
        [-2, 'WGST', 'Western Greenland Summer Time', '-3:WGT'],
        [-2, 'PMDT', 'Pierre & Miquelon Daylight Time', '-3:PMST'],
        [-2.5, 'NDT', 'Newfoundland Daylight Time', '-3.5:NST'],
        [-3, 'ADT', 'Atlantic Daylight Time', '-4:AST'],
        [-4, 'EDT', 'Eastern Daylight Time', '-5:EST'],
        [-5, 'CDT', 'Central Daylight Time', '-6:CST'],
        [-6, 'MDT', 'Mountain Daylight Time', '-7:MST'],
        [-7, 'PDT', 'Pacific Daylight Time', '-8:PST'],
        [-8, 'AKDT', 'Alaska Daylight Time', '-9:AKST'],
        [-9, 'HADT', 'Hawaii-Aleutian Daylight Time', '-10:HAST'],
		[-5, 'CST', 'Cuba Standard Time'],
		[-4, 'CDT', 'Cuba Daylight Time', '-5:CST'],
		//south america
		[-4, 'AMT', 'Amazon Time'],
		[-3, 'AMST', 'Amazon Summer Time', '-4:AMT'],
		[-3, 'ART', 'Argentina Time'],
		[-4, 'BOT', 'Bolivia Time'],
		[-3, 'BRT', 'Brasilia Time'],
		[-2, 'BRST', 'Brasilia Summer Time', '-3:BRT'],
		[-4, 'CLT', 'Chile Standard Time'],
		[-3, 'CLST', 'Chile Summer Time', '-4:CLT'],
		[-5, 'COT', 'Columbia Time'],
		[-5, 'ECT', 'Ecuador Time'],
		[-4, 'FKT', 'Falkland Islands Time'],
		[-3, 'FKST', 'Falkland Islands Summer Time', '-4:FKT'],
		[-2, 'FNT', 'Fernando de Noronha Time'],
		[-3, 'GFT', 'French Guiana Time'],
		[-4, 'GYT', 'Guyana Time'],
		[-5, 'PET', 'Peru Time'],
		[-4, 'PYT', 'Paraguay Time'],
		[-3, 'PYST', 'Paraguay Summer Time', '-4:PYT'],
		[-3, 'SRT', 'Suriname Time'],
		[-3, 'UYT', 'Uruguay Time'],
		[-2, 'UYST', 'Uruguay Summer Time', '-3:UYT'],
		[-4.5, 'VET', 'Venezuelan Standard Time'],
		//africa
		[2, 'CAT', 'Central Africa Time'],
		[-1, 'CVT', 'Cape Verde Time'],
		[3, 'EAT', 'Eastern Africa Time'],
		[4, 'MUT', 'Mauritius Time'],
		[4, 'RET', 'Reunion Time'],
		[2, 'SAST', 'South Africa Standard Time'],
		[4, 'SCT', 'Seychelles Time'],
		[1, 'WAT', 'West Africa Time'],
		[2, 'WAST', 'West Africa Summer Time', '1:WAT'],
		[0, 'WT', 'Western Sahara Standard Time'],
		//europe
		[1, 'BST', 'British Summer Time', '0:GMT'],
		[1, 'CET', 'Central European Time'],
		[2, 'CEST', 'Central European Summer Time', '1:CET'],
		[2, 'EET', 'Eastern European Time'],
		[3, 'EEST', 'Eastern European Summer Time', '2:EET'],
		[0, 'WET', 'Western European Time'],
		[1, 'WEST', 'Western European Summer Time', '0:WET'],
		[1, 'IST', 'Irish Standard Time', '0:GMT'],
		[1, 'IST (Ireland)', 'Irish Standard Time', '0:GMT'],
		[4, 'KUYT', 'Kuybyshev Time'],
		[4, 'SAMT', 'Samara Time', '4:KUYT'],
		[3, 'MSK', 'Moscow Standard Time'],
		[4, 'MSD', 'Moscow Daylight Time', '3:MSK'],
		//asia
		[4.5, 'AFT', 'Afghanistan Time'],
		[6, 'ALMT', 'Alma-Ata Time'],
		[4, 'AMT', 'Armenia Time'],
		[5, 'AMST', 'Armenia Summer Time', '4:AMT'],
		[12, 'ANAT', 'Anadyr Time'],
		[12, 'ANAST', 'Anadyr Summer Time', '12:ANAT'],
		[5, 'AQTT', 'Aqtobe Time'],
		[3, 'AST', 'Arabia Standard Time'],
		[4, 'AZT', 'Azerbaijan Time'],
		[5, 'AZST', 'Azerbaijan Summer Time', '4:AZT'],
		[8, 'BNT', 'Brunei Darussalam Time'],
		[6, 'BST', 'Bangladesh Standard Time'],
		[6, 'BTT', 'Bhutan Time'],
		[8, 'CST', 'China Standard Time'],
		[4, 'GET', 'Gerogia Standard Time'],
		[4, 'GST', 'Gulf Standard Time'],
		[8, 'HKT', 'Hong Kong Time'],
		[7, 'HOVT', 'Hovd Time'],
		[7, 'ICT', 'Indochina Time'],
		[2, 'IST', 'Israel Standard Time'],
		[2, 'IST (Israel)', 'Israel Standard Time'],
		[3, 'IDT', 'Israel Daylight Time', '2:IST'],
		[5.5, 'IST', 'India Standard Time'],
		[3.5, 'IRST', 'Iran Standard Time'],
		[4.5, 'IRDT', 'Iran Daylight Time', '3.5:IRST'],
		[8, 'IRKT', 'Irkutsk Time'],
		[9, 'IRKST', 'Irkutsk Summer Time'],
		[9, 'JST', 'Japan Standard Time'],
		[6, 'KGT', 'Kyrgyzstan Time'],
		[7, 'KRAT', 'Krasnoyarsk Time'],
		[8, 'KRAST', 'Krasnoyarsk Summer Time', '7:KRAT'],
		[9, 'KST', 'Korea Standard Time'],
		[11, 'MAGT', 'Magadan Time'],
		[12, 'MAGST', 'Magadan Summer Time', '11:MAGT'],
		[6.5, 'MMT', 'Myanmar Time'],
		[5, 'MVT', 'Maldives Time'],
		[8, 'MYT', 'Malaysia Time'],
		[6, 'NOVT', 'Novosibirsk Time'],
		[7, 'NOVST', 'Novosibirsk Summer Time', '6:NOVT'],
		[5.75, 'NPT', 'Nepal Time'],
		[6, 'OMST', 'Omsk Standard Time'],
		[7, 'OMSST', 'Omsk Summer Time'],
		[12, 'PETT', 'Kamchatka Time'],
		[12, 'PETST', 'Kamchatka Summer Time'],
		[8, 'PHT', 'Philippine Time'],
		[5, 'PKT', 'Pakistan Standard Time'],
		[8, 'SGT', 'Singapore Time'],
		[5, 'TJT', 'Tajikistan Time'],
		[9, 'TLT', 'East Timor Time'],
		[5,'TMT','Turkmenistan Time'],
		[8,'ULAT','Ulaanbaatar Time'],
		[5,'UZT','Uzbekistan Time'],
		[10,'VLAT','Vladivostok Time'],
		[11,'VLAST','Vladivostok Summer Time', '10:VLAT'],
		[7,'WIB','Western Indonesian Time'],
		[9,'WIT','Eastern Indonesian Time'],
		[8,'WITA','Central Indonesian Time'],
		[9,'YAKT','Yakutsk Time'],
		[10,'YAKST','Yakutsk Summer Time', '9:YAKT'],
		[5,'YEKT','Yekaterinburg Time'],
		[6,'YEKST','Yekaterinburg Summer Time', '5:YEKT'],
		//pacific
		[12.75, 'CHAST','Chatham Island Standard Time'],
		[13.75, 'CHADT','Chatham Island Daylight Time', '12.75:CHAST'],
		[10, 'ChST','Chamorro Standard Time'],
		[-10, 'CKT','Cook Island Time'],
		[-6, 'EAST','Easter Island Standard Time'],
		[-5, 'EASST','Easter Island Summer Time', '-6:EAST'],
		[11, 'EDT','Eastern Daylight Time'],
		[13, 'FJST','Fiji Summer Time'],
		[12, 'FJT','Fiji Time'],
		[-6, 'GALT','Galapagos Time'],
		[-9, 'GAMT','Gambier Time'],
		[12, 'GILT','Gilbert Island Time'],
		[14, 'LINT','Line Islands Time'],
		[-9.5, 'MART','Marquesas Time'],
		[12, 'MHT','Marshall Islands Time'],
		[11, 'NCT','New Caledonia Time'],
		[-11, 'NUT','Niue Time'],
		[12, 'NZST','New Zealand Standard Time'],
		[13, 'NZDT','New Zealand Daylight Time', '12:NZST'],
		[10, 'PGT','Papua New Guinea Time'],
		[13, 'PHOT','Phoenix Island Time'],
		[11, 'PONT','Pohnpei Standard Time'],
		[-8, 'PST','Pitcairn Standard Time'],
		[9, 'PWT','Palau Time'],
		[11, 'SBT','Solomon Islands Time'],
		[-11, 'SST','Samoa Standard Time'],
		[-10, 'TAHT','Tahiti Time'],
		[-10, 'TKT','Tokelau Time'],
		[12, 'TVT','Tuvalu Time'],
		[11, 'VUT','Vanuatu Time'],
		[12, 'WFT','Wallis and Futuna Time'],
		[-11, 'WST','West Samoa Time'],
		[10, 'YAPT','Yap Time'],
		//australia
		[9.5, 'CST', 'Central Standard Time'],
		[9.5, 'CST (Australia)', 'Central Standard Time'],
		[10.5, 'CDT', 'Central Daylight Time', '9.5:CST'],
		[7, 'CXT', 'Christmas Island Time'],
		[10, 'EST', 'Eastern Standard Time'],
		[10, 'EST (Australia)', 'Eastern Standard Time'],
		[11, 'EDT', 'Eastern Daylight Time', '10:EST'],
		[10.5, 'LHST', 'Lord Howe Standard Time'],
		[11, 'LHDT', 'Lord Howe Daylight Time', '10.5:LHST'],
		[11.5, 'NFT', 'Norfolk Time'],
		[8, 'WST', 'Western Standard Time'],
		[9, 'WDT', 'Western Daylight Time', '8:WST'],
		//misc
		[-1, 'AZOT', 'Azores Time'],
		[0, 'AZOST', 'Azores Summer Time', '-1:AZOT'],
		[6.5, 'CCT', 'Cocos Islands Time'],
		[6, 'IOT', 'Indian Chagos Time'],
		[5, 'TFT', 'French Southern and Artarctic Time'],
		[8, 'CAST', 'Casey Time'],
		[7, 'DAVT', 'Davis Time'],
		[5, 'MAWT', 'Mawson Time']
        ];

	var timezones = buildTimeZones(tz);
	
	//daylight savings times information for those timezones
	//month (0 based), hour, minute, day of week (0 based), week of month (-1 means last week of month)
	$.fn.timezone.times = { 
        'EGT': [[2,22,0,6,-1], [9,23,0,6,-1]],
        'WGT': [[2,22,0,6,-1], [9,23,0,6,-1]],
        'PMST': [[2,2,0,0,2],[10,2,0,0,1]],
        'NST':[[2,2,0,0,2],[10,2,0,0,1]],
        'AST':[[2,2,0,0,2],[10,2,0,0,1]],
        'EST':[[2,2,0,0,2],[10,2,0,0,1]],
        'CST':[[2,2,0,0,2],[10,2,0,0,1]],
        'MST':[[2,2,0,0,2],[10,2,0,0,1]],
        'PST':[[2,2,0,0,2],[10,2,0,0,1]],
        'AKST':[[2,2,0,0,2],[10,2,0,0,1]],
        'HAST':[[2,2,0,0,2],[10,2,0,0,1]],
        'BRT':[[9,0,0,0,3],[1,0,0,0,3]],
        'CLT':[[9,0,0,0,2],[3,0,0,0,1]],
        'FKT':[[8,2,0,0,1],[3,2,0,0,3]],
        'PYT':[[9,0,0,0,1],[3,0,0,0,2]],
        'UYT':[[9,2,0,0,1],[2,2,0,0,2]],
        'WAT':[[8,2,0,0,1],[3,2,0,0,1]],
        'BST':[[2,1,0,0,-1],[9,1,0,0,-1]],
        'CET':[[2,1,0,0,-1],[9,1,0,0,-1]],
        'EET':[[2,1,0,0,-1],[9,1,0,0,-1]],
        'WET':[[2,1,0,0,-1],[9,1,0,0,-1]],
        'IST (Ireland)':[[2,1,0,0,-1],[9,1,0,0,-1]],
        'KUYT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'MSK':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'AMT':[[2,2,0,0,2],[9,3,0,0,-1]],
        'ANAT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'AZT':[[2,4,0,0,-1],[9,5,0,0,-1]],
        'IST (Israel)':[[2,2,0,0,-1],[8,2,0,0,2]],
        'KRAT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'MAGT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'NOVT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'VLAT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'YAKT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'YEKT':[[2,2,0,0,-1],[9,3,0,0,-1]],
        'CHAST':[[8,2,45,0,-1],[3,3,45,0,1]],
        'EAST':[[9,23,0,6,2],[3,22,0,6,1]],
        'NZST':[[8,2,0,0,-1],[3,3,0,0,1]],
        'CST (Australia)':[[9,2,0,0,1],[3,3,0,0,1]],
        'EST (Australia)':[[9,2,0,0,1],[3,3,0,0,1]],
        'LHST':[[9,2,0,0,1],[3,2,0,0,1]],
        'WST':[[9,2,0,0,1],[3,3,0,0,1]],
        'AZOT':[[2,0,0,0,-1],[9,1,0,0,-1]]
	};
	
})(jQuery);
