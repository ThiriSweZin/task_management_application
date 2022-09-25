/**
 * Myanmar Date
 */

const MM = {
  months: ["တန်ခူး", "ကဆုန်", "နယုန်", "ဝါဆို", "ဝါခေါင်", "တော်သလင်း", "သီတင်းကျွတ်", "တန်ဆောင်မုန်း", "နတ်တော်", "ပြာသို", "တပို့တွဲ", "တပေါင်း"],
  month_names: ["ပ-ဝါဆို", "တန်ခူး", "ကဆုန်", "နယုန်", "ဝါဆို", "ဝါခေါင်", "တော်သလင်း", "သီတင်းကျွတ်", "တန်ဆောင်မုန်း", "နတ်တော်", "ပြာသို", "တပို့တွဲ", "တပေါင်း", "နှောင်းတန်ခူး", "နှောင်းကဆုန်"],
  days: ["တနင်္ဂနွေ", "တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ"],
  day: "နေ့",
  date: "ရက်",
  year: ["ခုနှစ်", "ပြည့်နှစ်"],
  moonPhase: [ "လဆန်း", "လပြည့်", "လဆုတ်", "လကွယ်"],
  sabbath: "ဥပုသ်နေ့",
  sabbathEve: "အဖိတ်နေ့"
};

class MyanmarDate {

  constructor(date = new Date()) {
    // get current time in julian date
    const ut = date.getTime() / 1000.0;
    this.jdn = 2440587.5 + ut / 86400.0;

    this.mm = this.j2m(this.jdn);
    this.day = date.getDay();
  }

  /**
   * Julian date to Western date
   * @param {number} jd julian date
   * @param {number} ct calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian]
   * @param {number} SG Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
   * @return Western date (y=year, m=month, d=day, h=hour, n=minute, s=second)
   */
  j2w(jd, ct = 0, SG = 2361222) {
    // 2361222-Gregorian start in British calendar (1752/Sep/14)
    let j, jf, y, m, d, h, n, s;
    if (ct == 2 || (ct == 0 && (jd < SG))) {
      j = Math.floor(jd + 0.5);
      jf = jd + 0.5 - j;
      const b = j + 1524;
      const c = Math.floor((b - 122.1) / 365.25);
      const f = Math.floor(365.25 * c);
      const e = Math.floor((b - f) / 30.6001);
      m = (e > 13) ? (e - 13) : (e - 1);
      d = b - f - Math.floor(30.6001 * e);
      y = m < 3 ? (c - 4715) : (c - 4716);
    } else {
      j = Math.floor(jd + 0.5);
      jf = jd + 0.5 - j;
      j -= 1721119;
      y = Math.floor((4 * j - 1) / 146097);
      j = 4 * j - 1 - 146097 * y;
      d = Math.floor(j / 4);
      j = Math.floor((4 * d + 3) / 1461);
      d = 4 * d + 3 - 1461 * j;
      d = Math.floor((d + 4) / 4);
      m = Math.floor((5 * d - 3) / 153);
      d = 5 * d - 3 - 153 * m;
      d = Math.floor((d + 5) / 5);
      y = 100 * y + j;
      if (m < 10) {
        m += 3;
      } else {
        m -= 9;
        y = y + 1;
      }
    }
    jf *= 24;
    h = Math.floor(jf);
    jf = (jf - h) * 60;
    n = Math.floor(jf);
    s = (jf - n) * 60;
    return {
      y: y,
      m: m,
      d: d,
      h: h,
      n: n,
      s: s
    };
  }

  /**
   * Search a 1D array
   * @param {string} key 
   * @param {Array} arr 
   * @return index
   */
  bSearch1(key, arr) {
    let i = 0;
    let l = 0;
    let u = arr.length - 1;
    while (u >= l) {
      i = Math.floor((l + u) / 2);
      if (arr[i] > key) u = i - 1;
      else if (arr[i] < key) l = i + 1;
      else return i;
    }
    return -1;
  }

  /**
   * Search first dimension in a 2D array
   * @param {string} key 
   * @param {Array} arr 
   * @return index
   */
  bSearch2(key, arr) {
    let i = 0;
    let l = 0;
    let u = arr.length - 1;
    while (u >= l) {
      i = Math.floor((l + u) / 2);
      if (arr[i][0] > key) u = i - 1;
      else if (arr[i][0] < key) l = i + 1;
      else return i;
    }
    return -1;
  }

  /**
   * Get Myanmar year constants depending on era
   * @param {number} my myanmar year
   * @return 
   * EI = Myanmar calendar era id [1-3] : calculations methods/constants depends on era
   * WO = watat offset to compensate
   * NM = number of months to find excess days
   * EW = exception in watat year
   */
  getMyConst(my) {
    let EI, WO, NM, EW = 0;
    let fme, wte;
    // The third era (the era after Independence 1312 ME and after)
    if (my >= 1312) {
      EI = 3;
      WO = -0.5;
      NM = 8;
      fme = [
        [1377, 1]
      ];
      wte = [1344, 1345];
    }
    // The second era (the era under British colony: 1217 ME - 1311 ME)
    else if (my >= 1217) {
      EI = 2;
      WO = -1;
      NM = 4;
      fme = [
        [1234, 1],
        [1261, -1]
      ];
      wte = [1263, 1264];
    }
    // The first era (the era of Myanmar kings: ME1216 and before)
    // Thandeikta (ME 1100 - 1216)
    else if (my >= 1100) {
      EI = 1.3;
      WO = -0.85;
      NM = -1;
      fme = [
        [1120, 1],
        [1126, -1],
        [1150, 1],
        [1172, -1],
        [1207, 1]
      ];
      wte = [1201, 1202];
    }
    // Makaranta system 2 (ME 798 - 1099)
    else if (my >= 798) {
      EI = 1.2;
      WO = -1.1;
      NM = -1;
      fme = [
        [813, -1],
        [849, -1],
        [851, -1],
        [854, -1],
        [927, -1],
        [933, -1],
        [936, -1],
        [938, -1],
        [949, -1],
        [952, -1],
        [963, -1],
        [968, -1],
        [1039, -1]
      ];
      wte = [];
    }
    // Makaranta system 1 (ME 0 - 797)
    else {
      EI = 1.1;
      WO = -1.1;
      NM = -1;
      fme = [
        [205, 1],
        [246, 1],
        [471, 1],
        [572, -1],
        [651, 1],
        [653, 2],
        [656, 1],
        [672, 1],
        [729, 1],
        [767, -1]
      ];
      wte = [];
    }
    let i = this.bSearch2(my, fme);
    if (i >= 0) WO += fme[i][1]; // full moon day offset exceptions
    i = this.bSearch1(my, wte);
    if (i >= 0) EW = 1; //correct watat exceptions

    return {
      EI: EI,
      WO: WO,
      NM: NM,
      EW: EW
    };
  }

  /**
   * Check watat (ဝါထပ်) (intercalary month)
   * @param {number} my myanmar year
   * @return watat = intercalary month [1=watat, 0=common]
   * fm = full moon day of 2nd Waso in jdn_mm (jdn+6.5 for MMT) [only valid when watat=1])
   */
  cal_watat(my) {
    //get data for respective era	
    const SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
    const LM = 1577917828.0 / 53433336.0; //lunar month (29.53058795)
    const MO = 1954168.050623; //beginning of 0 ME for MMT
    const c = this.getMyConst(my); // get constants for the corresponding calendar era
    const TA = (SY / 12 - LM) * (12 - c.NM); //threshold to adjust
    let ed = (SY * (my + 3739)) % LM; // excess day
    if (ed < TA) ed += LM; //adjust excess days
    const fm = Math.round(SY * my + MO - ed + 4.5 * LM + c.WO); //full moon day of 2nd Waso
    let TW = 0;
    let watat = 0; //find watat
    if (c.EI >= 2) { //if 2nd era or later find watat based on excess days
      TW = LM - (SY / 12 - LM) * c.NM;
      if (ed >= TW) watat = 1;
    } else { //if 1st era,find watat by 19 years metonic cycle
      //Myanmar year is divided by 19 and there is intercalary month
      //if the remainder is 2,5,7,10,13,15,18
      //https://github.com/kanasimi/CeJS/blob/master/data/date/calendar.js#L2330
      watat = (my * 7 + 2) % 19;
      if (watat < 0) watat += 19;
      watat = Math.floor(watat / 12);
    }
    watat ^= c.EW; //correct watat exceptions	
    return {
      fm: fm,
      watat: watat
    };
  }

  /**
   * Check Myanmar Year
   * @param {number} my myanmar year
   * @return myt = year type [0=common, 1=little watat, 2=big watat],
   * tg1 = the 1st day of Tagu as jdn_mm (Julian Day Number for MMT)
   * fm = full moon day of [2nd] Waso as Julain Day Number
   * werr = watat discrepancy [0=ok, 1= error] )
   */
  cal_my(my) {
    let yd = 0;
    let y1; 
    let nd = 0;
    let werr = 0;
    let fm = 0;
    const y2 = this.cal_watat(my);
    let myt = y2.watat;
    do {
      yd++;
      y1 = this.cal_watat(my - yd);
    } while (y1.watat == 0 && yd < 3);
    if (myt) {
      nd = (y2.fm - y1.fm) % 354;
      myt = Math.floor(nd / 31) + 1;
      fm = y2.fm;
      if (nd != 30 && nd != 31) {
        werr = 1;
      }
    } else fm = y1.fm + 354 * yd;
    var tg1 = y1.fm + 354 * yd - 102;
    return {
      myt: myt,
      tg1: tg1,
      fm: fm,
      werr: werr
    };
  }

  /**
   * Get length of month from month, and year type.
   * @param {*} mm month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
   *  Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
   *  Tabaung=12, Late Tagu=13, Late Kason=14 ],
   * @param {*} myt year type [0=common, 1=little watat, 2=big watat]
   * @return length of the month [29 or 30 days]
   */
  cal_mml(mm, myt) {
    let mml = 30 - mm % 2; //month length
    if (mm == 3) mml += Math.floor(myt / 2); //adjust if Nayon in big watat
    return mml;
  }

  /**
   * Get moon phase from day of the month, month, and year type.
   * @param {number} md day of the month
   * @param {number} mm month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
   *  Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
   *  Tabaung=12, Late Tagu=13, Late Kason=14 ],
   * @param {number} myt year type [0=common, 1=little watat, 2=big watat]
   * @return moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon]
   */
  cal_mp(md, mm, myt) {
    const mml = this.cal_mml(mm, myt);
    return (Math.floor((md + 1) / 16) + Math.floor(md / 16) + Math.floor(md / mml));
  }

  /**
   * Get the apparent length of the year from year type.
   * @param {number} myt year type [0=common, 1=little watat, 2=big watat]
   * @return year length [354, 384, or 385 days]
   */
  cal_myl(myt) {
    return (354 + (1 - Math.floor(1 / (myt + 1))) * 30 + Math.floor(myt / 2));
  }

  /**
   * Get fortnight day from month day
   * @param {number} md day of the month [1-30]
   * @return fortnight day [1 to 15]
   */
  cal_mf(md) {
    return (md - 15 * Math.floor(md / 16));
  }

  /**
   * Get day of month from fortnight day, moon phase, and length of the month
   * @param {number} mf fortnight day [1 to 15]
   * @param {number} mp moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon]
   * @param {number} mm month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
   *  Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
   *  Tabaung=12, Late Tagu=13, Late Kason=14 ],
   * @param {number} myt year type [0=common, 1=little watat, 2=big watat])
   * @return day of the month [1-30]
   */
  cal_md(mf, mp, mm, myt) {
    const mml = this.cal_mml(mm, myt);
    const m1 = mp % 2;
    const m2 = Math.floor(mp / 2);
    return (m1 * (15 + m2 * (mml - 15)) + (1 - m1) * (mf + 15 * m2));
  }

  /**
   * Get sabbath day and sabbath eve from day of the month, month, and year type.
   * @param {number} md day of the month [1-30]
   * @param {number} mm month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
   *  Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
   *  Tabaung=12, Late Tagu=13, Late Kason=14 ],
   * @param {number} myt year type [0=common, 1=little watat, 2=big watat])
   */
  cal_sabbath(md, mm, myt) {
    const mml = this.cal_mml(mm, myt);
    let s = 0;
    if ((md == 8) || (md == 15) || (md == 23) || (md == mml)) s = 1;
    if ((md == 7) || (md == 14) || (md == 22) || (md == (mml - 1))) s = 2;
    return s;
  }

  /**
   * Julian day number to Myanmar date
   * @param {number} jdn julian day number
   * @return {object} 
   *  myt =year type [0=common, 1=little watat, 2=big watat],
   *  my = year,
   *  mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
   *    Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
   *    Tabaung=12, Late Tagu=13, Late Kason=14 ],
   * md = day of the month [1 to 30])
   */
  j2m(jdn) {
    jdn = Math.round(jdn); //convert jdn to integer
    const SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
    const MO = 1954168.050623; //beginning of 0 ME
    let my = Math.floor((jdn - 0.5 - MO) / SY); //Myanmar year
    let yo = this.cal_my(my); //check year
    let dd = jdn - yo.tg1 + 1; //day count
    let b = Math.floor(yo.myt / 2);
    let c = Math.floor(1 / (yo.myt + 1)); //big wa and common yr
    let myl = 354 + (1 - c) * 30 + b; //year length
    let mmt = Math.floor((dd - 1) / myl); //month type: late =1 or early = 0
    dd -= mmt * myl;
    let a = Math.floor((dd + 423) / 512); //adjust day count and threshold
    let mm = Math.floor((dd - b * a + c * a * 30 + 29.26) / 29.544); //month
    const e = Math.floor((mm + 12) / 16);
    const f = Math.floor((mm + 11) / 16);
    const md = dd - Math.floor(29.544 * mm - 29.26) - b * e + c * f * 30; //day
    mm += f * 3 - e * 4 + 12 * mmt; // adjust month numbers for late months
    return {
      myt: yo.myt,
      my: my,
      mm: mm,
      md: md
    };
  }

  /**
   * Myanmar date to Julian day number
   * @param {number} my year
   * @param {number} mm month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
   *    Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
   *    Tabaung=12, Late Tagu=13, Late Kason=14 ],
   * @param {number} md day of the month [1-30]
   * @return julian day number
   */
  m2j(my, mm, md) {
    const yo = this.cal_my(my); //check year
    const mmt = Math.floor(mm / 13);
    mm = mm % 13 + mmt; // to 1-12 with month type
    const b = Math.floor(yo.myt / 2);
    const c = 1 - Math.floor((yo.myt + 1) / 2); //if big watat and common year	 
    mm += 4 - Math.floor((mm + 15) / 16) * 4 + Math.floor((mm + 12) / 16); //adjust month
    let dd = md + Math.floor(29.544 * mm - 29.26) - c * Math.floor((mm + 11) / 16) * 30 +
      b * Math.floor((mm + 12) / 16);
    const myl = 354 + (1 - c) * 30 + b;
    dd += mmt * myl; //adjust day count with year length
    return (dd + yo.tg1 - 1);
  }

  /**
   * Get holidays
   * @param {number} jdn Julian Day Number
   * @return array of strings
   */
  cal_holiday(jdn) {
    jdn = Math.round(jdn);
    const yo = this.j2m(jdn);
    const myt = yo.myt;
    const my = yo.my;
    const mm = yo.mm;
    const md = yo.md;
    const mp = this.cal_mp(md, mm, myt);
    const mmt = Math.floor(mm / 13);
    const hs = [];
    const go = this.j2w(jdn);
    const gy = go.y;
    const gm = go.m;
    const gd = go.d;
    //---------------------------------
    // Thingyan
    const SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
    const MO = 1954168.050623; //beginning of 0 ME
    const BGNTG = 1100;
    const SE3 = 1312; //start of Thingyan and third era
    const ja = SY * (my + mmt) + MO; // atat time
    let jk;
    if (my >= SE3) jk = ja - 2.169918982; // akya time
    else jk = ja - 2.1675;
    const akn = Math.round(jk);
    const atn = Math.round(ja);
    if (jdn == (atn + 1)) {
      hs.push("နှစ်ဆန်းတစ်ရက်နေ့");
    }
    if ((my + mmt) >= BGNTG) {
      if (jdn == atn) {
        hs.push("သင်္ကြန်အတက်နေ့");
      } else if ((jdn > akn) && (jdn < atn)) {
        hs.push("သင်္ကြန်အကြတ်နေ့");
      } else if (jdn == akn) {
        hs.push("သင်္ကြန်အကျနေ့");
      } else if (jdn == (akn - 1)) {
        hs.push("သင်္ကြန်အကြိုနေ့");
      } else if (((my + mmt) >= 1369) && ((my + mmt) < 1379) && ((jdn == (akn - 2)) ||
          ((jdn >= (atn + 2)) && (jdn <= (akn + 7))))) {
        hs.push("ရုံးပိတ်ရက်");
      }
    }
    //---------------------------------
    // holidays on gregorian calendar	
    if ((gy >= 2018) && (gm == 1) && (gd == 1)) {
      hs.push("နှစ်သစ်ကူးနေ့");
    } else if ((gy >= 1948) && (gm == 1) && (gd == 4)) {
      hs.push("လွတ်လပ်ရေးနေ့");
    } else if ((gy >= 1947) && (gm == 2) && (gd == 12)) {
      hs.push("ပြည်ထောင်စုနေ့");
    } else if ((gy >= 1958) && (gm == 3) && (gd == 2)) {
      hs.push("တောင်သူလယ်သမားနေ့");
    } else if ((gy >= 1945) && (gm == 3) && (gd == 27)) {
      hs.push("တော်လှန်ရေးနေ့");
    } else if ((gy >= 1923) && (gm == 5) && (gd == 1)) {
      hs.push("အလုပ်သမားနေ့");
    } else if ((gy >= 1947) && (gm == 7) && (gd == 19)) {
      hs.push("အာဇာနည်နေ့");
    } else if ((gy >= 1752) && (gm == 12) && (gd == 25)) {
      hs.push("ခရစ္စမတ်နေ့");
    } else if ((gy == 2017) && (gm == 12) && (gd == 30)) {
      hs.push("ရုံးပိတ်ရက်");
    } else if ((gy >= 2017) && (gm == 12) && (gd == 31)) {
      hs.push("ရုံးပိတ်ရက်");
    }
    //---------------------------------
    // holidays on myanmar calendar
    if ((mm == 2) && (mp == 1)) {
      hs.push("ဗုဒ္ဓနေ့");
    } //Vesak day
    else if ((mm == 4) && (mp == 1)) {
      hs.push("ဓမ္မစကြာနေ့");
    } //Warso day
    else if ((mm == 7) && (mp == 1)) {
      hs.push("မီးထွန်းပွဲ");
    } else if ((my >= 1379) && (mm == 7) && (md == 14 || md == 16)) {
      hs.push("ရုံးပိတ်ရက်");
    } else if ((mm == 8) && (mp == 1)) {
      hs.push("တန်ဆောင်တိုင်");
    } else if ((my >= 1379) && (mm == 8) && (md == 14)) {
      hs.push("ရုံးပိတ်ရက်");
    } else if ((my >= 1282) && (mm == 8) && (md == 25)) {
      hs.push("အမျိုးသားနေ့");
    } else if ((mm == 10) && (md == 1)) {
      hs.push("ကရင်နှစ်သစ်ကူးနေ့");
    } else if ((mm == 12) && (mp == 1)) {
      hs.push("တပေါင်းပွဲ");
    }
    return hs;
  }

  convertMmNumber(num) {
    return `${num}`.replace(/([0-9])/g, function(m, m1) {
      return String.fromCharCode(parseInt(m1) + 4160);
    });
  }

  toString() {
    const year = this.convertMmNumber(this.mm.my);
    const surfixYear = MM.year[(this.mm.my % 10) == 0 ? 1 : 0];

    const month = MM.month_names[this.mm.mm];
    const mp = this.cal_mp(this.mm.md, this.mm.mm, this.mm.myt);
    let mpStr = MM.moonPhase[mp];

    const date = this.convertMmNumber(this.mm.md);
    const day = MM.days[this.day];

    let str = `${year}-${surfixYear}၊ ${month}${mpStr} (${date})${MM.date}၊ ${day}${MM.day}`;
    const holiday = this.cal_holiday(this.jdn);
    if (holiday.length > 0) {
      str += `၊ ${holiday.join("၊ ")}`;
    }

    const sabbath = this.cal_sabbath(this.mm.md, this.mm.mm, this.mm.myt);
    if (sabbath == 2) {
      str += `၊ ${MM.sabbathEve}`;
    } else if (sabbath == 1) {
      str += `၊ ${MM.sabbath}`;
    }
    
    return str;
  }
}

module.exports = MyanmarDate;