/* Academic Lead — Academic Monitoring & Documentation Portal
   Department of Computer Applications, School of Computing & Informatics */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */
  // The password lives on the server (PORTAL_PASSWORD), never in this file.
  var CLASSES = ['I BCA', 'II BCA', 'III BCA', 'I MCA', 'II MCA'];
  var YEARS = ['2025–26', '2026–27', '2027–28', '2028–29'];
  var YEAR_DEFAULT = '2026–27';
  var SEMS = ['Semester 1', 'Semester 2'];
  var EVENT_TYPES = ['Workshop', 'Seminar', 'Guest Lecture', 'Technical Symposium', 'Cultural Event',
    'Sports', 'Industrial Visit', 'Hackathon', 'Certification Programme', 'Community Service',
    'Placement Drive', 'Other'];
  var ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.json';
  var MAX_UPLOAD_MB = 3;

  var ICONS = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    att: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="8" r="3.2"/><path d="M16.5 11.5 18 13l3-3.2"/></svg>',
    asm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h4"/></svg>',
    co: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.6 5.5 6 .9-4.3 4.3 1 6.1L12 17l-5.3 2.8 1-6.1L3.4 9.4l6-.9z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H8l-4 3.5v-14A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z"/><path d="M8.5 9h7M8.5 12.5h4"/></svg>',
    ros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v15H4z"/><path d="M4 9h16M9 9v11"/></svg>',
    rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>'
  };

  var MODULES = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
    { id: 'attendance', label: 'Attendance & Counselling', icon: 'att', tone: 'n' },
    { id: 'assessment', label: 'Assessment', icon: 'asm', tone: '' },
    { id: 'cocurricular', label: 'Co-Curricular Activities', icon: 'co', tone: 'g' },
    { id: 'feedback', label: 'Course Feedback', icon: 'fb', tone: 'k' }
  ];
  var TOOLS = [
    { id: 'roster', label: 'Student Roster', icon: 'ros' },
    { id: 'reports', label: 'Reports & Export', icon: 'rep' }
  ];

  /* --------------------------------------------------------------- helpers */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function todayISO() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : iso;
  }
  function fmtWhen(ms) {
    if (!ms) return '';
    var diff = Date.now() - ms;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    var d = new Date(ms), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear();
  }
  function fmtBytes(b) {
    if (!b && b !== 0) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function lsGet(k, fb) {
    try { var v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); }
    catch (e) { return fb; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

  function toast(msg, kind, ms) {
    var host = document.getElementById('toasts');
    var t = el('div', 'toast ' + (kind || ''));
    t.innerHTML = kind === 'busy' ? '<span class="spin"></span><span>' + esc(msg) + '</span>'
      : '<span>' + esc(msg) + '</span>';
    host.appendChild(t);
    var done = false;
    var kill = function () { if (!done) { done = true; t.remove(); } };
    if (kind !== 'busy') setTimeout(kill, ms || 3600);
    return kill;
  }

  /* ----------------------------------------------------------------- modal */
  var modalStack = [];
  function openModal(opts) {
    var root = document.getElementById('modalRoot');
    var wrap = el('div', 'modal');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    var box = el('div', 'modal-box' + (opts.small ? ' sm' : ''));
    var head = el('div', 'modal-head');
    head.innerHTML = '<div><h2>' + esc(opts.title) + '</h2>' +
      (opts.sub ? '<div class="mh-sub">' + esc(opts.sub) + '</div>' : '') + '</div>';
    var x = el('button', '', '×');
    x.setAttribute('aria-label', 'Close');
    head.appendChild(x);
    var body = el('div', 'modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else body.appendChild(opts.body);
    var foot = el('div', 'modal-foot');
    box.appendChild(head); box.appendChild(body); box.appendChild(foot);
    wrap.appendChild(box); root.appendChild(wrap);

    function close() {
      wrap.remove();
      modalStack = modalStack.filter(function (m) { return m !== close; });
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    modalStack.push(close);
    x.addEventListener('click', close);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });

    (opts.buttons || []).forEach(function (b) {
      var btn = el('button', 'btn ' + (b.cls || 'btn-ghost'), esc(b.label));
      btn.type = 'button';
      btn.addEventListener('click', function () { b.onClick ? b.onClick(close, btn) : close(); });
      foot.appendChild(btn);
    });
    var first = body.querySelector('input,select,textarea,button');
    if (first) setTimeout(function () { try { first.focus(); } catch (e) { } }, 40);
    return { close: close, body: body, foot: foot };
  }

  function confirmDialog(title, message, confirmLabel, onYes) {
    openModal({
      title: title, small: true,
      body: '<p style="margin:0;color:var(--muted)">' + esc(message) + '</p>',
      buttons: [
        { label: 'Cancel', cls: 'btn-ghost' },
        { label: confirmLabel, cls: 'btn-danger', onClick: function (close) { close(); onYes(); } }
      ]
    });
  }

  /* ----------------------------------------------------------------- store */
  var Store = {
    mode: 'offline', canUpload: true, ready: false, user: '',
    cache: { attendance: [], assessment: [], cocurricular: [], feedback: [], roster: [] },

    api: function (path, opts) {
      opts = opts || {};
      var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: {} };
      if (opts.body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(opts.body);
      }
      return fetch('/api' + path, init).then(function (r) {
        if (r.status === 401) {
          lsSet('al_auth', false);
          var e = new Error('Your session has expired. Please sign in again.');
          e.code = 'unauthorized';
          throw e;
        }
        return r.text().then(function (txt) {
          var json = {};
          try { json = txt ? JSON.parse(txt) : {}; } catch (err) { json = {}; }
          if (!r.ok) {
            var err2 = new Error(json.error || 'The server returned an error (' + r.status + ').');
            err2.code = json.code || 'http_' + r.status;
            throw err2;
          }
          return json;
        });
      });
    },

    init: function () {
      var self = this;
      var cols = Object.keys(self.cache);
      return Promise.all(cols.map(function (c) {
        return self.api('/records/' + c).then(function (res) {
          self.cache[c] = res.records || [];
          return true;
        });
      })).then(function () {
        self.mode = 'online';
        self.ready = true;
      }).catch(function (e) {
        self.mode = 'offline';
        self.ready = true;
        throw e;
      });
    },

    refresh: function () {
      var self = this;
      return self.init().then(function () { App.render(); });
    },

    all: function (c) { return this.cache[c] || []; },

    put: function (c, rec) {
      var self = this;
      var existing = rec.id && self.cache[c].some(function (r) { return r.id === rec.id; });
      var call = existing
        ? self.api('/records/' + c + '/' + encodeURIComponent(rec.id), { method: 'PUT', body: rec })
        : self.api('/records/' + c, { method: 'POST', body: rec });
      return call.then(function (res) {
        var saved = res.record;
        var i = self.cache[c].findIndex(function (r) { return r.id === saved.id; });
        if (i >= 0) self.cache[c][i] = saved; else self.cache[c].push(saved);
        return saved;
      });
    },

    putMany: function (c, recs) {
      var self = this;
      if (!recs.length) return Promise.resolve({ records: [], skipped: 0 });
      return self.api('/records/' + c, { method: 'POST', body: { records: recs } })
        .then(function (res) {
          (res.records || []).forEach(function (r) { self.cache[c].push(r); });
          return res;
        });
    },

    remove: function (c, id) {
      var self = this;
      return self.api('/records/' + c + '/' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function () {
          self.cache[c] = self.cache[c].filter(function (r) { return r.id !== id; });
        });
    },

    upload: function (file) {
      var self = this;
      if (file.size > 3 * 1024 * 1024) {
        var e = new Error(file.name + ' is larger than the 3 MB limit.');
        e.code = 'too_large';
        return Promise.reject(e);
      }
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onerror = function () { reject(new Error('That file could not be read.')); };
        fr.onload = function () {
          var out = String(fr.result || '');
          var comma = out.indexOf(',');
          resolve(comma >= 0 ? out.slice(comma + 1) : out);
        };
        fr.readAsDataURL(file);
      }).then(function (b64) {
        return self.api('/files', {
          method: 'POST',
          body: { name: file.name, type: file.type || 'application/octet-stream', data: b64 }
        });
      }).then(function (res) {
        return { id: res.id, name: res.name, size: res.size, type: res.type, stored: true };
      });
    },

    fileUrl: function (id, download) {
      return '/api/files/' + encodeURIComponent(id) + (download ? '?download=1' : '');
    },

    // A plain browser download — this build runs on an ordinary web server.
    save: function (opts) {
      try {
        var blob = opts.data instanceof Blob ? opts.data
          : new Blob([opts.data], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = opts.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast('Downloaded ' + opts.filename, 'ok');
        return Promise.resolve(true);
      } catch (e) {
        toast('Could not download the file.', 'bad');
        return Promise.resolve(false);
      }
    }
  };

  /* ------------------------------------------------------------ field spec */
  var SPEC = {
    attendance: {
      label: 'Attendance & Counselling', tone: 'n',
      fields: [
        { k: 'date', l: 'Date of attendance / counselling', t: 'date', req: true },
        { k: 'type', l: 'Type of record', t: 'select', opts: ['Attendance', 'Counselling'], req: true },
        { k: 'student', t: 'student', wide: true },
        { k: 'acadYear', l: 'Academic year', t: 'select', opts: YEARS, req: true },
        { k: 'details', l: 'Attendance details / counselling discussion', t: 'textarea', req: true, wide: true, ph: 'What was recorded or discussed' },
        { k: 'issues', l: 'Issues identified', t: 'textarea', wide: true, ph: 'Shortage of attendance, academic difficulty, personal difficulty…' },
        { k: 'action', l: 'Action taken / suggestions provided', t: 'textarea', wide: true },
        { k: 'followUp', l: 'Follow-up date', t: 'date' },
        { k: 'proof', l: 'Proof / evidence', t: 'files', wide: true },
        { k: 'remarks', l: 'Additional remarks', t: 'textarea', wide: true }
      ],
      cols: [
        { k: 'date', l: 'Date', fmt: 'date', w: '104px' },
        { k: 'studentName', l: 'Student' },
        { k: 'rollNo', l: 'Roll No' },
        { k: 'type', l: 'Type', fmt: 'typePill' },
        { k: 'details', l: 'Details', clip: true },
        { k: 'followUp', l: 'Follow-up', fmt: 'followUp' },
        { k: 'proof', l: 'Proof', fmt: 'proofCount' }
      ]
    },
    assessment: {
      label: 'Assessment', tone: '',
      fields: [
        { k: 'acadYear', l: 'Academic year', t: 'select', opts: YEARS, req: true },
        { k: 'sem', l: 'Semester', t: 'select', opts: SEMS, req: true },
        { k: 'cls', l: 'Class', t: 'select', opts: CLASSES, req: true },
        { k: 'subject', l: 'Subject / course name', t: 'text', req: true, ph: 'e.g. Data Structures' },
        { k: 'details', l: 'Assessment details', t: 'textarea', req: true, wide: true, ph: 'Marks pattern, pass percentage, observations…' },
        { k: 'justification', l: 'Justification', t: 'textarea', wide: true, ph: 'Why the results came out this way' },
        { k: 'actionPlan', l: 'Action plan', t: 'textarea', wide: true },
        { k: 'review', l: 'Review / follow-up remarks', t: 'textarea', wide: true },
        { k: 'proof', l: 'Proof / evidence', t: 'files', wide: true }
      ],
      cols: [
        { k: 'acadYear', l: 'Year', w: '92px' },
        { k: 'cls', l: 'Class', w: '84px' },
        { k: 'sem', l: 'Semester' },
        { k: 'subject', l: 'Subject' },
        { k: 'details', l: 'Assessment details', clip: true },
        { k: 'actionPlan', l: 'Action plan', clip: true },
        { k: 'proof', l: 'Proof', fmt: 'proofCount' }
      ]
    },
    cocurricular: {
      label: 'Co-Curricular Activities', tone: 'g',
      fields: [
        { k: 'acadYear', l: 'Academic year', t: 'select', opts: YEARS, req: true },
        { k: 'eventName', l: 'Event name', t: 'text', req: true, ph: 'e.g. National Workshop on Cloud Computing' },
        { k: 'eventType', l: 'Event type / category', t: 'select', opts: EVENT_TYPES, req: true },
        { k: 'date', l: 'Date of event', t: 'date', req: true },
        { k: 'numStudents', l: 'Number of students participated', t: 'number', req: true, min: 0 },
        { k: 'classes', l: 'Year / class of participating students', t: 'text', req: true, ph: 'e.g. II BCA, III BCA' },
        { k: 'coordinator', l: 'Faculty coordinator', t: 'text', ph: 'Name of coordinating faculty' },
        { k: 'description', l: 'Event description', t: 'textarea', wide: true, req: true },
        { k: 'proof', l: 'Proof / evidence', t: 'files', wide: true },
        { k: 'remarks', l: 'Additional remarks', t: 'textarea', wide: true }
      ],
      cols: [
        { k: 'acadYear', l: 'Year', w: '92px' },
        { k: 'eventName', l: 'Event name' },
        { k: 'eventType', l: 'Category' },
        { k: 'date', l: 'Date', fmt: 'date', w: '104px' },
        { k: 'numStudents', l: 'Students', fmt: 'num', w: '92px' },
        { k: 'classes', l: 'Year / Class' },
        { k: 'proof', l: 'Proof', fmt: 'proofCount' }
      ]
    },
    feedback: {
      label: 'Course Feedback', tone: 'k',
      fields: [
        { k: 'acadYear', l: 'Academic year', t: 'select', opts: YEARS, req: true },
        { k: 'subject', l: 'Subject name', t: 'text', req: true, ph: 'e.g. Operating Systems' },
        { k: 'code', l: 'Course / subject code', t: 'text', req: true, ph: 'e.g. 23CA3105' },
        { k: 'faculty', l: 'Faculty name', t: 'text', ph: 'Optional' },
        { k: 'phase1', l: 'Feedback phase 1', t: 'textarea', wide: true, ph: 'Rating, student comments, observations from the first phase' },
        { k: 'phase2', l: 'Feedback phase 2', t: 'textarea', wide: true, ph: 'Rating, student comments, observations from the second phase' },
        { k: 'actionPlan', l: 'Action plan', t: 'textarea', wide: true, ph: 'Improvements planned on the basis of this feedback' },
        { k: 'proof', l: 'Proof / evidence', t: 'files', wide: true },
        { k: 'remarks', l: 'Additional remarks', t: 'textarea', wide: true }
      ],
      cols: [
        { k: 'subject', l: 'Subject' },
        { k: 'code', l: 'Code', w: '110px' },
        { k: 'faculty', l: 'Faculty' },
        { k: 'phase1', l: 'Feedback phase 1', clip: true },
        { k: 'phase2', l: 'Feedback phase 2', clip: true },
        { k: 'actionPlan', l: 'Action plan', clip: true },
        { k: 'proof', l: 'Proof', fmt: 'proofCount' }
      ]
    }
  };

  /* ------------------------------------------------------------- form build */
  function buildForm(moduleId, record, context) {
    var spec = SPEC[moduleId];
    var form = el('form', 'stack');
    form.noValidate = true;
    var grid = el('div', 'grid2');
    var state = { proof: (record && record.proof ? record.proof.slice() : []), newFiles: [] };

    if (context && Object.keys(context).length) {
      var ctx = el('div', 'card pad');
      ctx.style.padding = '10px 14px';
      ctx.style.background = 'var(--sunk)';
      ctx.style.boxShadow = 'none';
      ctx.innerHTML = Object.keys(context).map(function (k) {
        return '<span style="font-size:12px;color:var(--muted)"><strong style="color:var(--ink)">' +
          esc(context[k]) + '</strong> · ' + esc(k) + '</span>';
      }).join('<span style="color:var(--line-2);margin:0 10px">|</span>');
      form.appendChild(ctx);
    }

    spec.fields.forEach(function (f) {
      if (f.t === 'student') { grid.appendChild(studentField(record, context)); return; }
      if (f.t === 'files') { grid.appendChild(filesField(f, state)); return; }
      var wrap = el('div', 'field' + (f.wide ? ' wide' : ''));
      var id = 'f_' + moduleId + '_' + f.k;
      wrap.innerHTML = '<label for="' + id + '">' + esc(f.l) + (f.req ? ' <span class="req">*</span>' : '') + '</label>';
      var input;
      if (f.t === 'textarea') { input = el('textarea'); }
      else if (f.t === 'select') {
        input = el('select');
        input.innerHTML = '<option value="">— select —</option>' + f.opts.map(function (o) {
          return '<option value="' + esc(o) + '">' + esc(o) + '</option>';
        }).join('');
      } else { input = el('input'); input.type = f.t === 'number' ? 'number' : f.t; if (f.min != null) input.min = f.min; }
      input.id = id; input.name = f.k;
      if (f.ph) input.placeholder = f.ph;
      var val = record ? record[f.k] : (context && context._defaults ? context._defaults[f.k] : undefined);
      if (val == null && !record) {
        if (f.k === 'acadYear') val = YEAR_DEFAULT;
        if (f.k === 'date') val = todayISO();
        if (f.k === 'sem' && context && context.Semester) val = context.Semester;
        if (f.k === 'cls' && context && context.Class) val = context.Class;
      }
      if (val != null) input.value = val;
      wrap.appendChild(input);
      var err = el('div', 'err'); err.hidden = true; wrap.appendChild(err);
      grid.appendChild(wrap);
    });

    form.appendChild(grid);
    form._state = state;
    return form;
  }

  function studentField(record, context) {
    var wrap = el('div', 'field wide');
    var cls = (context && context.Class) || (record && record.cls) || '';
    var roster = Store.all('roster').filter(function (r) { return r.cls === cls; })
      .sort(function (a, b) { return String(a.rollNo).localeCompare(String(b.rollNo)); });
    var opts = roster.map(function (r) {
      return '<option value="' + esc(r.rollNo) + '">' + esc(r.rollNo) + ' — ' + esc(r.name) + '</option>';
    }).join('');
    wrap.innerHTML =
      '<label for="f_pick">Student <span class="req">*</span></label>' +
      (roster.length
        ? '<select id="f_pick" style="margin-bottom:9px"><option value="">— pick from roster, or type below —</option>' + opts + '</select>'
        : '<div class="hint" style="margin-bottom:9px">No roster loaded for ' + esc(cls || 'this class') +
        '. Add students under Student Roster to pick them from a list here.</div>') +
      '<div class="grid2" style="gap:10px">' +
      '<div class="field"><label for="f_studentName">Student name <span class="req">*</span></label><input id="f_studentName" name="studentName" type="text" placeholder="Full name as in records"><div class="err" hidden></div></div>' +
      '<div class="field"><label for="f_rollNo">Student ID / Roll number <span class="req">*</span></label><input id="f_rollNo" name="rollNo" type="text" placeholder="Roll number"><div class="err" hidden></div></div>' +
      '</div>';
    if (record) {
      wrap.querySelector('#f_studentName').value = record.studentName || '';
      wrap.querySelector('#f_rollNo').value = record.rollNo || '';
    }
    var pick = wrap.querySelector('#f_pick');
    if (pick) pick.addEventListener('change', function () {
      var hit = roster.find(function (r) { return String(r.rollNo) === pick.value; });
      if (hit) {
        wrap.querySelector('#f_studentName').value = hit.name;
        wrap.querySelector('#f_rollNo').value = hit.rollNo;
      }
    });
    return wrap;
  }

  function filesField(f, state) {
    var wrap = el('div', 'field wide');
    wrap.innerHTML = '<label for="f_proof">' + esc(f.l) + '</label>';
    var box = el('div', 'filebox');
    box.innerHTML = '<input id="f_proof" type="file" multiple accept="' + ACCEPT + '">' +
      '<div class="hint" style="margin-top:7px">PDF, images, Word, Excel, PowerPoint, CSV and text files, ' +
      'up to ' + MAX_UPLOAD_MB + ' MB each. Larger scans should be compressed before uploading.</div>';
    wrap.appendChild(box);
    var list = el('div', 'filelist');
    wrap.appendChild(list);

    function paint() {
      clear(list);
      state.proof.forEach(function (p, i) {
        var row = el('div', 'fileitem');
        row.innerHTML = '<span class="fn">' + esc(p.name) + '</span>' +
          '<span class="hint">' + esc(fmtBytes(p.size)) + (p.stored ? '' : ' · not stored') + '</span>';
        var rm = el('button', 'btn btn-sm btn-danger', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', function () { state.proof.splice(i, 1); paint(); });
        row.appendChild(rm);
        list.appendChild(row);
      });
      state.newFiles.forEach(function (file, i) {
        var row = el('div', 'fileitem');
        row.innerHTML = '<span class="fn">' + esc(file.name) + '</span><span class="hint">' +
          esc(fmtBytes(file.size)) + ' · will upload on save</span>';
        var rm = el('button', 'btn btn-sm btn-ghost', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', function () { state.newFiles.splice(i, 1); paint(); });
        row.appendChild(rm);
        list.appendChild(row);
      });
      if (!Store.canUpload && state.newFiles.length) {
        var w = el('div', 'hint');
        w.style.color = 'var(--warn)';
        w.textContent = 'File storage is unavailable in this view, so only the file names will be recorded.';
        list.appendChild(w);
      }
    }
    box.querySelector('input').addEventListener('change', function (e) {
      Array.prototype.forEach.call(e.target.files, function (file) { state.newFiles.push(file); });
      e.target.value = '';
      paint();
    });
    paint();
    return wrap;
  }

  function readForm(form, moduleId) {
    var spec = SPEC[moduleId], out = {}, bad = [];
    form.querySelectorAll('.err').forEach(function (e) { e.hidden = true; });
    form.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });

    function grab(name, req, label) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return '';
      var v = String(input.value || '').trim();
      if (req && !v) {
        input.setAttribute('aria-invalid', 'true');
        var err = input.parentElement.querySelector('.err');
        if (err) { err.textContent = label + ' is required.'; err.hidden = false; }
        bad.push(name);
      }
      return v;
    }
    spec.fields.forEach(function (f) {
      if (f.t === 'files') return;
      if (f.t === 'student') {
        out.studentName = grab('studentName', true, 'Student name');
        out.rollNo = grab('rollNo', true, 'Roll number');
        return;
      }
      out[f.k] = grab(f.k, f.req, f.l);
      if (f.t === 'number' && out[f.k] !== '') out[f.k] = Number(out[f.k]);
    });
    if (bad.length) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return null;
    }
    return out;
  }

  function saveRecord(moduleId, form, base, existing, after) {
    var data = readForm(form, moduleId);
    if (!data) { toast('Some required fields are still empty.', 'bad'); return; }
    var state = form._state;
    var rec = Object.assign({}, existing || {}, base, data);
    rec.proof = state.proof.slice();
    rec.enteredBy = (existing && existing.enteredBy) || App.user || '';
    rec.lastBy = App.user || '';

    var busy = toast(state.newFiles.length ? 'Uploading evidence…' : 'Saving record…', 'busy');
    var chain = Promise.resolve();
    state.newFiles.forEach(function (file) {
      chain = chain.then(function () {
        if (!Store.canUpload) {
          rec.proof.push({ name: file.name, size: file.size, type: file.type, stored: false });
          return;
        }
        return Store.upload(file).then(function (p) {
          if (p) rec.proof.push(p);
        }).catch(function (e) {
          var c = e && e.code;
          rec.proof.push({ name: file.name, size: file.size, type: file.type, stored: false });
          toast(c === 'too_large' ? file.name + ' is over the ' + MAX_UPLOAD_MB + ' MB limit — only the name was recorded.'
            : 'Could not upload ' + file.name + ' — only the name was recorded.', 'warn', 6000);
        });
      });
    });
    chain.then(function () { return Store.put(moduleId, rec); })
      .then(function () {
        busy();
        toast(existing ? 'Record updated.' : 'Record saved.', 'ok');
        if (after) after();
        App.render();
      })
      .catch(function (e) {
        busy();
        var c = e && e.code;
        if (c === 'unauthorized') { toast('Your session expired. Reloading the sign-in screen…', 'bad', 4000); setTimeout(function () { location.reload(); }, 1500); return; }
        toast((e && e.message) || 'Could not save the record. Please try again.', 'bad', 7000);
      });
  }

  function openRecordForm(moduleId, opts) {
    opts = opts || {};
    var spec = SPEC[moduleId];
    var form = buildForm(moduleId, opts.record, opts.context);
    var m = openModal({
      title: (opts.record ? 'Edit ' : 'New ') + spec.label.replace(/ Activities$/, '') + ' record',
      sub: opts.sub || '',
      body: form,
      buttons: [
        { label: 'Cancel', cls: 'btn-ghost' },
        {
          label: opts.record ? 'Update record' : 'Save record', cls: 'btn-primary',
          onClick: function (close) {
            saveRecord(moduleId, form, opts.base || {}, opts.record, close);
          }
        }
      ]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    return m;
  }

  /* ------------------------------------------------------------ record view */
  function openRecordView(moduleId, rec) {
    var spec = SPEC[moduleId];
    var body = el('div');
    var rows = [];
    if (moduleId === 'attendance') {
      rows.push(['Student', (rec.studentName || '—') + '  ·  ' + (rec.rollNo || '—')]);
      rows.push(['Class & semester', (rec.cls || '—') + ' · ' + (rec.sem || '—')]);
    }
    spec.fields.forEach(function (f) {
      if (f.t === 'files' || f.t === 'student') return;
      var v = rec[f.k];
      if (f.t === 'date') v = fmtDate(v);
      rows.push([f.l, (v === '' || v == null) ? '—' : String(v)]);
    });
    if (moduleId === 'feedback' || moduleId === 'assessment') {
      rows.splice(1, 0, ['Class & semester', (rec.cls || '—') + ' · ' + (rec.sem || '—')]);
    }
    rows.push(['Entered by', rec.enteredBy || '—']);
    rows.push(['Last updated', fmtWhen(rec.updatedAt)]);
    body.innerHTML = rows.map(function (r) {
      return '<div class="kv"><div class="k">' + esc(r[0]) + '</div><div class="v">' + esc(r[1]) + '</div></div>';
    }).join('');

    var pf = el('div');
    pf.innerHTML = '<div class="k" style="font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:600;margin:14px 0 7px">Proof / evidence</div>';
    if (!rec.proof || !rec.proof.length) {
      pf.appendChild(el('div', 'hint', 'No files attached to this record.'));
    } else {
      var list = el('div', 'filelist');
      rec.proof.forEach(function (p) {
        var row = el('div', 'fileitem');
        row.innerHTML = '<span class="fn">' + esc(p.name) + '</span><span class="hint">' + esc(fmtBytes(p.size)) + '</span>';
        if (p.stored && p.id) {
          var a = el('a', 'btn btn-sm btn-ghost', 'Open');
          a.href = Store.fileUrl(p.id); a.target = '_blank'; a.rel = 'noopener';
          row.appendChild(a);
          var dl = el('a', 'btn btn-sm btn-ghost', 'Download');
          dl.href = Store.fileUrl(p.id, true);
          dl.setAttribute('download', p.name);
          row.appendChild(dl);
        } else {
          row.appendChild(el('span', 'hint', 'file not stored'));
        }
        list.appendChild(row);
      });
      pf.appendChild(list);
    }
    body.appendChild(pf);

    openModal({
      title: 'Record details',
      sub: spec.label,
      body: body,
      buttons: [
        { label: 'Close', cls: 'btn-ghost' },
        {
          label: 'Edit this record', cls: 'btn-primary', onClick: function (close) {
            close();
            openRecordForm(moduleId, { record: rec, context: contextOf(moduleId, rec) });
          }
        }
      ]
    });
  }

  function contextOf(moduleId, rec) {
    if (moduleId === 'attendance') return { Class: rec.cls, Semester: rec.sem, 'Academic year': rec.acadYear };
    if (moduleId === 'feedback') return { Class: rec.cls, Semester: rec.sem };
    if (moduleId === 'assessment') return { Assessment: rec.kind === 'SA' ? 'Summative (SA)' : 'Formative (FA)' };
    return {};
  }

  /* ------------------------------------------------------------ record list */
  var ui = { list: {} };
  function listState(key) {
    if (!ui.list[key]) ui.list[key] = { q: '', sort: null, dir: 'desc', page: 1, f: {}, size: 10 };
    return ui.list[key];
  }

  function cellValue(rec, col) {
    var v = rec[col.k];
    if (col.fmt === 'date') return '<span class="nowrap">' + esc(fmtDate(v)) + '</span>';
    if (col.fmt === 'num') return esc(v == null || v === '' ? '—' : v);
    if (col.fmt === 'typePill') {
      return '<span class="pill ' + (v === 'Counselling' ? 'pill-cou' : 'pill-att') + '">' + esc(v || '—') + '</span>';
    }
    if (col.fmt === 'kindPill') {
      return '<span class="pill ' + (v === 'SA' ? 'pill-sa' : 'pill-fa') + '">' + esc(v || '—') + '</span>';
    }
    if (col.fmt === 'followUp') {
      if (!v) return '<span class="hint">—</span>';
      var overdue = v < todayISO();
      return '<span class="pill ' + (overdue ? 'pill-due' : 'pill-att') + '">' + esc(fmtDate(v)) + '</span>';
    }
    if (col.fmt === 'proofCount') {
      var n = (v || []).length;
      return n ? '<span class="pill pill-att">' + n + ' file' + (n > 1 ? 's' : '') + '</span>' : '<span class="hint">—</span>';
    }
    if (v === '' || v == null) return '<span class="hint">—</span>';
    return col.clip ? '<div class="cellclip">' + esc(v) + '</div>' : esc(v);
  }

  function renderList(host, opts) {
    var key = opts.key, st = listState(key), cols = opts.cols, all = opts.rows;

    var bar = el('div', 'toolbar');
    var search = el('div', 'search');
    search.innerHTML = ICONS.search;
    var si = el('input');
    si.type = 'search'; si.placeholder = opts.searchPlaceholder || 'Search records…';
    si.value = st.q; si.id = 'q_' + key.replace(/[^\w-]+/g, '_');
    si.addEventListener('input', function () { st.q = si.value; st.page = 1; App.render(); });
    search.appendChild(si);
    bar.appendChild(search);

    (opts.filters || []).forEach(function (f) {
      var sel = el('select', 'filtersel');
      sel.innerHTML = '<option value="">' + esc(f.label) + ': all</option>' + f.options.map(function (o) {
        return '<option value="' + esc(o) + '">' + esc(o) + '</option>';
      }).join('');
      sel.value = st.f[f.k] || '';
      sel.id = ('fl_' + key + '_' + f.k).replace(/[^\w-]+/g, '_');
      sel.setAttribute('aria-label', f.label);
      sel.addEventListener('change', function () { st.f[f.k] = sel.value; st.page = 1; App.render(); });
      bar.appendChild(sel);
    });
    if (opts.actionsRight) opts.actionsRight.forEach(function (b) { bar.appendChild(b); });
    host.appendChild(bar);

    var rows = all.filter(function (r) {
      var ok = true;
      (opts.filters || []).forEach(function (f) {
        var want = st.f[f.k];
        if (want && String(r[f.k] || '') !== want) ok = false;
      });
      if (!ok) return false;
      if (!st.q) return true;
      var hay = cols.map(function (c) { return r[c.k]; }).concat([r.studentName, r.rollNo, r.remarks, r.subject]).join(' ').toLowerCase();
      return hay.indexOf(st.q.toLowerCase()) >= 0;
    });

    var sortKey = st.sort || opts.defaultSort || cols[0].k;
    rows.sort(function (a, b) {
      var x = a[sortKey], y = b[sortKey];
      if (typeof x === 'number' && typeof y === 'number') return st.dir === 'asc' ? x - y : y - x;
      x = String(x == null ? '' : x); y = String(y == null ? '' : y);
      return st.dir === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
    });

    var wrap = el('div', 'tablewrap');
    if (!rows.length) {
      var e = el('div', 'empty');
      e.innerHTML = '<div class="e-title">' + esc(all.length ? 'No records match those filters' : (opts.emptyTitle || 'No records yet')) + '</div>' +
        '<div>' + esc(all.length ? 'Clear the search or filters to see all ' + all.length + ' records.' : (opts.emptyMsg || 'Use the button above to add the first record.')) + '</div>';
      wrap.appendChild(e);
      host.appendChild(wrap);
      return;
    }

    var pages = Math.max(1, Math.ceil(rows.length / st.size));
    if (st.page > pages) st.page = pages;
    var slice = rows.slice((st.page - 1) * st.size, st.page * st.size);

    var table = el('table');
    var thead = el('thead');
    var tr = el('tr');
    cols.forEach(function (c) {
      var th = el('th', 'sortable', esc(c.l) + (sortKey === c.k ? (st.dir === 'asc' ? ' ▲' : ' ▼') : ''));
      if (c.w) th.style.width = c.w;
      th.addEventListener('click', function () {
        if (st.sort === c.k) st.dir = st.dir === 'asc' ? 'desc' : 'asc';
        else { st.sort = c.k; st.dir = 'asc'; }
        App.render();
      });
      tr.appendChild(th);
    });
    var tha = el('th', '', 'Actions'); tha.style.width = '1%'; tr.appendChild(tha);
    thead.appendChild(tr); table.appendChild(thead);

    var tbody = el('tbody');
    slice.forEach(function (rec) {
      var row = el('tr');
      cols.forEach(function (c) {
        var td = el('td', c.fmt === 'num' ? 'num' : '', cellValue(rec, c));
        row.appendChild(td);
      });
      var acts = el('td', 'acts');
      var bView = el('button', 'btn btn-sm btn-ghost', 'View');
      bView.addEventListener('click', function () { openRecordView(opts.module, rec); });
      var bEdit = el('button', 'btn btn-sm btn-ghost', 'Edit');
      bEdit.style.marginLeft = '5px';
      bEdit.addEventListener('click', function () {
        openRecordForm(opts.module, { record: rec, context: contextOf(opts.module, rec) });
      });
      var bDel = el('button', 'btn btn-sm btn-danger', 'Delete');
      bDel.style.marginLeft = '5px';
      bDel.addEventListener('click', function () {
        confirmDialog('Delete this record?',
          'This removes the record permanently for everyone using the portal. Uploaded evidence stays in storage but will no longer be linked.',
          'Delete record', function () {
            Store.remove(opts.module, rec.id).then(function () {
              toast('Record deleted.', 'ok'); App.render();
            }).catch(function () { toast('Could not delete the record.', 'bad'); });
          });
      });
      acts.appendChild(bView); acts.appendChild(bEdit); acts.appendChild(bDel);
      row.appendChild(acts);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    var pager = el('div', 'pager');
    pager.appendChild(el('span', '', 'Showing ' + ((st.page - 1) * st.size + 1) + '–' +
      Math.min(st.page * st.size, rows.length) + ' of ' + rows.length));
    var prev = el('button', 'btn btn-sm btn-ghost', 'Previous');
    prev.disabled = st.page <= 1;
    prev.addEventListener('click', function () { st.page--; App.render(); });
    var next = el('button', 'btn btn-sm btn-ghost', 'Next');
    next.disabled = st.page >= pages;
    next.addEventListener('click', function () { st.page++; App.render(); });
    pager.appendChild(prev); pager.appendChild(next);
    wrap.appendChild(pager);
    host.appendChild(wrap);
  }

  /* ----------------------------------------------------------------- export */
  function exportCols(moduleId) {
    var spec = SPEC[moduleId];
    var cols = [];
    if (moduleId === 'attendance') cols.push({ k: 'studentName', l: 'Student name' }, { k: 'rollNo', l: 'Roll number' }, { k: 'cls', l: 'Class' }, { k: 'sem', l: 'Semester' });
    if (moduleId === 'feedback') cols.push({ k: 'cls', l: 'Class' }, { k: 'sem', l: 'Semester' });
    if (moduleId === 'assessment') cols.push({ k: 'kind', l: 'Assessment type' });
    spec.fields.forEach(function (f) {
      if (f.t === 'files' || f.t === 'student') return;
      if (cols.some(function (c) { return c.k === f.k; })) return;
      cols.push({ k: f.k, l: f.l, date: f.t === 'date' });
    });
    cols.push({ k: 'proof', l: 'Proof files', proof: true });
    cols.push({ k: 'enteredBy', l: 'Entered by' });
    return cols;
  }
  function rowObject(rec, cols) {
    var o = {};
    cols.forEach(function (c) {
      var v = rec[c.k];
      if (c.proof) v = (v || []).map(function (p) { return p.name; }).join('; ');
      else if (c.date) v = fmtDate(v);
      o[c.l] = v == null ? '' : v;
    });
    return o;
  }
  function exportCSV(moduleId, rows, name) {
    var cols = exportCols(moduleId);
    var lines = [cols.map(function (c) { return '"' + c.l.replace(/"/g, '""') + '"'; }).join(',')];
    rows.forEach(function (r) {
      var o = rowObject(r, cols);
      lines.push(cols.map(function (c) {
        return '"' + String(o[c.l]).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
      }).join(','));
    });
    Store.save({ filename: name + '.csv', data: '﻿' + lines.join('\r\n') });
  }
  function exportXLSX(moduleId, rows, name) {
    if (typeof XLSX === 'undefined') { toast('The spreadsheet library did not load. Try CSV instead.', 'bad', 5000); return; }
    var cols = exportCols(moduleId);
    var data = rows.map(function (r) { return rowObject(r, cols); });
    var ws = XLSX.utils.json_to_sheet(data, { header: cols.map(function (c) { return c.l; }) });
    ws['!cols'] = cols.map(function (c) { return { wch: Math.min(42, Math.max(12, c.l.length + 4)) }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, SPEC[moduleId].label.slice(0, 28));
    var buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    Store.save({ filename: name + '.xlsx', data: buf });
  }
  function exportReport(moduleId, rows, title, subtitle) {
    var cols = exportCols(moduleId).filter(function (c) { return c.k !== 'enteredBy'; });
    var head = cols.map(function (c) { return '<th>' + esc(c.l) + '</th>'; }).join('');
    var body = rows.map(function (r) {
      var o = rowObject(r, cols);
      return '<tr>' + cols.map(function (c) { return '<td>' + esc(o[c.l]) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var html = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<title>' + esc(title) + '</title><style>' +
      'body{font-family:Georgia,"Times New Roman",serif;color:#12203A;margin:28px;font-size:12px}' +
      'h1{font-size:19px;margin:0 0 3px;color:#0B2B6B}h2{font-size:13px;margin:0 0 3px;font-weight:600}' +
      '.sub{color:#5A6B88;font-size:11px;margin-bottom:14px}' +
      '.rule{height:3px;background:#0B2B6B;border-bottom:2px solid #C8A02E;margin-bottom:12px}' +
      'table{border-collapse:collapse;width:100%}th,td{border:1px solid #C5D2E8;padding:5px 7px;text-align:left;vertical-align:top}' +
      'th{background:#EDF2FA;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em}' +
      'tfoot td{font-weight:bold}@media print{body{margin:10mm}}' +
      '</style></head><body>' +
      '<h2>Vignan’s Foundation for Science, Technology &amp; Research</h2>' +
      '<h1>' + esc(title) + '</h1>' +
      '<div class="sub">Department of Computer Applications &middot; School of Computing &amp; Informatics<br>' +
      esc(subtitle) + ' &middot; ' + rows.length + ' record' + (rows.length === 1 ? '' : 's') +
      ' &middot; Generated ' + fmtDate(todayISO()) + '</div>' +
      '<div class="rule"></div>' +
      '<table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>' +
      '<p style="margin-top:20px;font-size:10.5px;color:#5A6B88">Signature of Head of the Department: ' +
      '_____________________________ &nbsp;&nbsp; Date: ______________</p>' +
      '</body></html>';
    var fileName = title.replace(/[^\w ]+/g, '').replace(/\s+/g, '-').toLowerCase() + '.html';
    var w = window.open('', '_blank');
    if (!w) {
      Store.save({ filename: fileName, data: new Blob([html], { type: 'text/html' }) });
      toast('Your browser blocked the print window, so the report was downloaded instead.', 'warn', 6500);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { try { w.print(); } catch (e) { } }, 500);
  }

  function exportButtons(moduleId, getRows, baseName, reportTitle, reportSub) {
    var row = el('div', 'btnrow');
    var mk = function (label, cls, fn) {
      var b = el('button', 'btn btn-sm ' + cls, label);
      b.type = 'button';
      b.addEventListener('click', function () {
        var rows = getRows();
        if (!rows.length) { toast('There are no records to export.', 'warn'); return; }
        fn(rows);
      });
      return b;
    };
    row.appendChild(mk('Export CSV', 'btn-ghost', function (r) { exportCSV(moduleId, r, baseName); }));
    row.appendChild(mk('Export Excel', 'btn-ghost', function (r) { exportXLSX(moduleId, r, baseName); }));
    row.appendChild(mk('Printable report', 'btn-ghost', function (r) { exportReport(moduleId, r, reportTitle, reportSub); }));
    return row;
  }

  /* ------------------------------------------------------------------ views */
  var App = {
    current: 'dashboard', user: '', nav: {
      attendance: { sem: SEMS[0], cls: null },
      feedback: { sem: SEMS[0], cls: null },
      assessment: { kind: 'FA' },
      reports: { module: 'attendance' }
    }
  };

  function pageHead(eyebrow, title, desc, right) {
    var h = el('div', 'pagehead');
    var l = el('div');
    l.innerHTML = '<div class="eyebrow">' + esc(eyebrow) + '</div><h1>' + esc(title) + '</h1>' +
      (desc ? '<p>' + esc(desc) + '</p>' : '');
    h.appendChild(l);
    if (right) h.appendChild(right);
    return h;
  }

  function tabBar(options, active, onPick) {
    var t = el('div', 'tabs');
    t.setAttribute('role', 'tablist');
    options.forEach(function (o) {
      var b = el('button', '', esc(o.label));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(o.value === active));
      b.addEventListener('click', function () { onPick(o.value); });
      t.appendChild(b);
    });
    return t;
  }

  function classRow(active, counts, onPick) {
    var row = el('div', 'classrow');
    CLASSES.forEach(function (c) {
      var b = el('button', 'classbtn');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c === active));
      b.innerHTML = '<span class="cb-name">' + esc(c) + '</span><span class="cb-count">' +
        (counts[c] || 0) + ' record' + (counts[c] === 1 ? '' : 's') + '</span>';
      b.addEventListener('click', function () { onPick(c === active ? null : c); });
      row.appendChild(b);
    });
    return row;
  }

  /* dashboard */
  function viewDashboard(host) {
    var att = Store.all('attendance'), asm = Store.all('assessment'),
      co = Store.all('cocurricular'), fb = Store.all('feedback');
    var participation = co.reduce(function (s, e) { return s + (Number(e.numStudents) || 0); }, 0);
    var fa = asm.filter(function (r) { return r.kind === 'FA'; }).length;
    var counsel = att.filter(function (r) { return r.type === 'Counselling'; }).length;
    var dueSoon = att.filter(function (r) { return r.followUp && r.followUp >= todayISO(); }).length;

    host.appendChild(pageHead('2026–27 · Department of Computer Applications', 'Dashboard',
      'Every record entered across the four modules, with the most recent activity from all portal users.'));

    var tiles = el('div', 'tiles');
    [
      ['n', 'Attendance & Counselling', att.length, counsel + ' counselling · ' + dueSoon + ' follow-ups ahead'],
      ['', 'FA / SA Assessment', asm.length, fa + ' formative · ' + (asm.length - fa) + ' summative'],
      ['g', 'Co-Curricular Events', co.length, participation.toLocaleString('en-IN') + ' student participations'],
      ['k', 'Course Feedback', fb.length, new Set(fb.map(function (r) { return r.subject; })).size + ' subjects covered']
    ].forEach(function (t) {
      var c = el('div', 'tile ' + t[0]);
      c.innerHTML = '<div class="t-label">' + esc(t[1]) + '</div><div class="t-value">' + t[2] +
        '</div><div class="t-note">' + esc(t[3]) + '</div>';
      tiles.appendChild(c);
    });
    host.appendChild(tiles);

    var cols = el('div', 'cols');
    cols.style.marginTop = '16px';

    var left = el('div', 'card pad stack');
    left.appendChild(el('div', 'section-title', 'Add a record'));
    left.appendChild(el('div', 'hint', 'Jump straight to a data-entry form.'));
    var quick = el('div', 'quickrow');
    [
      ['Attendance / counselling', 'Pick semester and class', function () { App.go('attendance'); }],
      ['FA or SA assessment', 'Formative or summative', function () { App.go('assessment'); }],
      ['Co-curricular event', 'Workshops, fests, visits', function () { App.go('cocurricular'); openRecordForm('cocurricular', {}); }],
      ['Course feedback', 'Phase 1 and phase 2', function () { App.go('feedback'); }]
    ].forEach(function (q) {
      var b = el('button', 'quick');
      b.type = 'button';
      b.innerHTML = '<span><span class="q-t">' + esc(q[0]) + '</span><br><span class="q-s">' + esc(q[1]) + '</span></span>';
      b.addEventListener('click', q[2]);
      quick.appendChild(b);
    });
    left.appendChild(quick);
    cols.appendChild(left);

    var right = el('div', 'card pad');
    right.appendChild(el('div', 'section-title', 'Recent activity'));
    var feed = el('div', 'feed');
    var items = [];
    var push = function (mod, tone, arr, title) {
      arr.forEach(function (r) { items.push({ mod: mod, tone: tone, t: title(r), r: r }); });
    };
    push('attendance', 'n', Store.all('attendance'), function (r) {
      return (r.type || 'Record') + ' · ' + (r.studentName || r.rollNo || 'Student') + ' (' + (r.cls || '—') + ')';
    });
    push('assessment', '', Store.all('assessment'), function (r) {
      return (r.kind || 'FA') + ' · ' + (r.subject || 'Subject') + ' (' + (r.cls || '—') + ')';
    });
    push('cocurricular', 'g', Store.all('cocurricular'), function (r) { return r.eventName || 'Event'; });
    push('feedback', 'k', Store.all('feedback'), function (r) {
      return 'Feedback · ' + (r.subject || 'Subject') + ' (' + (r.cls || '—') + ')';
    });
    items.sort(function (a, b) { return (b.r.updatedAt || 0) - (a.r.updatedAt || 0); });
    if (!items.length) {
      right.appendChild(el('div', 'hint', 'Nothing has been entered yet. Saved records will appear here with the most recent first.'));
    } else {
      items.slice(0, 8).forEach(function (it) {
        var row = el('div', 'feed-item');
        row.innerHTML = '<span class="feed-dot ' + it.tone + '"></span>' +
          '<span class="feed-main"><span class="feed-title">' + esc(it.t) + '</span><br>' +
          '<span class="feed-meta">' + esc(SPEC[it.mod].label + (it.r.lastBy ? ' · ' + it.r.lastBy : '')) + '</span></span>' +
          '<span class="feed-time">' + esc(fmtWhen(it.r.updatedAt)) + '</span>';
        row.style.cursor = 'pointer';
        row.addEventListener('click', function () { openRecordView(it.mod, it.r); });
        feed.appendChild(row);
      });
      right.appendChild(feed);
    }
    cols.appendChild(right);
    host.appendChild(cols);
  }

  /* attendance + feedback share the semester → class shape */
  function viewNested(host, moduleId) {
    var nav = App.nav[moduleId];
    var spec = SPEC[moduleId];
    var all = Store.all(moduleId);
    var isAtt = moduleId === 'attendance';

    host.appendChild(pageHead(
      isAtt ? 'Module 1' : 'Module 4',
      spec.label,
      isAtt ? 'Pick a semester, then a class, to record attendance or a counselling session with its evidence and follow-up.'
        : 'Pick a semester, then a class, to record subject feedback for both phases and the action plan that follows.'));

    host.appendChild(tabBar(SEMS.map(function (s) { return { label: '2026–27 ' + s, value: s }; }),
      nav.sem, function (v) { nav.sem = v; nav.cls = null; App.render(); }));

    var counts = {};
    CLASSES.forEach(function (c) {
      counts[c] = all.filter(function (r) { return r.cls === c && r.sem === nav.sem; }).length;
    });
    host.appendChild(classRow(nav.cls, counts, function (c) { nav.cls = c; App.render(); }));

    if (!nav.cls) {
      var hint = el('div', 'card pad');
      hint.style.marginTop = '16px';
      hint.innerHTML = '<div class="section-title">Choose a class</div><div class="hint" style="margin-top:4px">' +
        esc(nav.sem + ' holds ' + all.filter(function (r) { return r.sem === nav.sem; }).length +
          ' records in total. Select a class above to open its data-entry panel and record list.') + '</div>';
      host.appendChild(hint);
      return;
    }

    var rows = all.filter(function (r) { return r.cls === nav.cls && r.sem === nav.sem; });
    var panel = el('div', 'card pad stack');
    panel.style.marginTop = '16px';
    var head = el('div', 'pagehead');
    head.style.marginBottom = '0';
    var hl = el('div');
    hl.innerHTML = '<div class="eyebrow">' + esc(nav.sem) + ' · 2026–27</div>' +
      '<h1 style="font-size:21px">' + esc(nav.cls) + '</h1>' +
      '<p>' + rows.length + ' record' + (rows.length === 1 ? '' : 's') + ' for this class and semester.</p>';
    head.appendChild(hl);
    var addBtn = el('button', 'btn btn-primary', isAtt ? 'New attendance / counselling record' : 'New subject feedback record');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      openRecordForm(moduleId, {
        context: { Class: nav.cls, Semester: nav.sem },
        sub: nav.cls + ' · ' + nav.sem + ' · 2026–27',
        base: { cls: nav.cls, sem: nav.sem }
      });
    });
    head.appendChild(addBtn);
    panel.appendChild(head);

    var filters = isAtt ? [{ k: 'type', label: 'Type', options: ['Attendance', 'Counselling'] },
    { k: 'acadYear', label: 'Year', options: YEARS }]
      : [{ k: 'acadYear', label: 'Year', options: YEARS }];

    renderList(panel, {
      key: moduleId + '_' + nav.sem + '_' + nav.cls,
      module: moduleId,
      rows: rows,
      cols: spec.cols,
      filters: filters,
      defaultSort: isAtt ? 'date' : 'subject',
      searchPlaceholder: isAtt ? 'Search by student, roll number, issue…' : 'Search by subject, code, faculty…',
      emptyTitle: 'No records for ' + nav.cls + ' yet',
      emptyMsg: 'Use the button above to add the first record for ' + nav.sem + '.'
    });

    panel.appendChild(exportButtons(moduleId, function () { return rows; },
      (moduleId + '-' + nav.cls + '-' + nav.sem).replace(/\s+/g, '-').toLowerCase(),
      spec.label + ' — ' + nav.cls,
      nav.sem + ' · 2026–27'));
    host.appendChild(panel);
  }

  /* assessment */
  function viewAssessment(host) {
    var nav = App.nav.assessment;
    var all = Store.all('assessment');
    var rows = all.filter(function (r) { return r.kind === nav.kind; });

    var addBtn = el('button', 'btn btn-primary', 'New ' + nav.kind + ' record');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      openRecordForm('assessment', {
        context: { Assessment: nav.kind === 'FA' ? 'Formative (FA)' : 'Summative (SA)' },
        sub: nav.kind === 'FA' ? 'Formative assessment' : 'Summative assessment',
        base: { kind: nav.kind }
      });
    });
    host.appendChild(pageHead('Module 2', 'Assessment',
      'Formative and summative records are kept separately, each with its justification, evidence and action plan.', addBtn));

    host.appendChild(tabBar([
      { label: 'FA — Formative Assessment', value: 'FA' },
      { label: 'SA — Summative Assessment', value: 'SA' }
    ], nav.kind, function (v) { nav.kind = v; App.render(); }));

    var panel = el('div', 'card pad stack');
    panel.style.marginTop = '16px';
    panel.appendChild(el('div', 'section-title',
      nav.kind === 'FA' ? 'Formative assessment records' : 'Summative assessment records'));
    panel.appendChild(el('div', 'hint', rows.length + ' record' + (rows.length === 1 ? '' : 's') +
      ' stored under ' + nav.kind + '. Filter by academic year, semester or class to narrow the list.'));

    renderList(panel, {
      key: 'assessment_' + nav.kind,
      module: 'assessment',
      rows: rows,
      cols: SPEC.assessment.cols,
      filters: [
        { k: 'acadYear', label: 'Year', options: YEARS },
        { k: 'sem', label: 'Semester', options: SEMS },
        { k: 'cls', label: 'Class', options: CLASSES }
      ],
      defaultSort: 'subject',
      searchPlaceholder: 'Search by subject, details, action plan…',
      emptyTitle: 'No ' + nav.kind + ' records yet',
      emptyMsg: 'Add the first ' + (nav.kind === 'FA' ? 'formative' : 'summative') + ' assessment record for any class.'
    });
    panel.appendChild(exportButtons('assessment', function () { return rows; },
      'assessment-' + nav.kind.toLowerCase(),
      (nav.kind === 'FA' ? 'Formative' : 'Summative') + ' Assessment Records', 'All classes'));
    host.appendChild(panel);
  }

  /* co-curricular */
  function viewCoCurricular(host) {
    var rows = Store.all('cocurricular');
    var participation = rows.reduce(function (s, e) { return s + (Number(e.numStudents) || 0); }, 0);
    var years = {};
    rows.forEach(function (r) { years[r.acadYear] = (years[r.acadYear] || 0) + 1; });
    var busiest = Object.keys(years).sort(function (a, b) { return years[b] - years[a]; })[0];

    var addBtn = el('button', 'btn btn-primary', 'New event');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () { openRecordForm('cocurricular', {}); });
    host.appendChild(pageHead('Module 3', 'Co-Curricular Activities',
      'Every workshop, seminar, fest, visit and drive conducted by the department, with participation counts and evidence.', addBtn));

    var tiles = el('div', 'tiles');
    [
      ['g', 'Total events', rows.length, busiest ? 'Most active year: ' + busiest : 'Across all academic years'],
      ['', 'Student participation', participation.toLocaleString('en-IN'), 'Sum of students across all events'],
      ['n', 'Average per event', rows.length ? Math.round(participation / rows.length) : 0, 'Students per event'],
      ['k', 'Categories used', new Set(rows.map(function (r) { return r.eventType; })).size, 'Distinct event types recorded']
    ].forEach(function (t) {
      var c = el('div', 'tile ' + t[0]);
      c.innerHTML = '<div class="t-label">' + esc(t[1]) + '</div><div class="t-value">' + t[2] +
        '</div><div class="t-note">' + esc(t[3]) + '</div>';
      tiles.appendChild(c);
    });
    host.appendChild(tiles);

    var panel = el('div', 'card pad stack');
    panel.style.marginTop = '16px';
    panel.appendChild(el('div', 'section-title', 'Event register'));
    renderList(panel, {
      key: 'cocurricular',
      module: 'cocurricular',
      rows: rows,
      cols: SPEC.cocurricular.cols,
      filters: [
        { k: 'acadYear', label: 'Year', options: YEARS },
        { k: 'eventType', label: 'Category', options: EVENT_TYPES }
      ],
      defaultSort: 'date',
      searchPlaceholder: 'Search by event, coordinator, description…',
      emptyTitle: 'No events recorded yet',
      emptyMsg: 'Add the first co-curricular event conducted by the department.'
    });
    panel.appendChild(exportButtons('cocurricular', function () { return rows; },
      'co-curricular-activities', 'Co-Curricular Activities Register', 'All academic years'));
    host.appendChild(panel);
  }

  /* roster */
  function viewRoster(host) {
    var rows = Store.all('roster');
    var addBtn = el('button', 'btn btn-primary', 'Import students');
    addBtn.type = 'button';
    addBtn.addEventListener('click', openRosterImport);
    host.appendChild(pageHead('Setup', 'Student Roster',
      'Students loaded here appear as a pick-list in the attendance and counselling form, so roll numbers fill themselves.', addBtn));

    var tiles = el('div', 'tiles');
    CLASSES.forEach(function (c) {
      var n = rows.filter(function (r) { return r.cls === c; }).length;
      var t = el('div', 'tile' + (n ? '' : ' g'));
      t.innerHTML = '<div class="t-label">' + esc(c) + '</div><div class="t-value">' + n +
        '</div><div class="t-note">' + (n ? 'students on roll' : 'not loaded yet') + '</div>';
      tiles.appendChild(t);
    });
    host.appendChild(tiles);

    var panel = el('div', 'card pad stack');
    panel.style.marginTop = '16px';
    panel.appendChild(el('div', 'section-title', 'All students'));

    var st = listState('roster');
    var bar = el('div', 'toolbar');
    var search = el('div', 'search');
    search.innerHTML = ICONS.search;
    var si = el('input'); si.type = 'search'; si.id = 'q_roster';
    si.placeholder = 'Search by name or roll number…'; si.value = st.q;
    si.addEventListener('input', function () { st.q = si.value; st.page = 1; App.render(); });
    search.appendChild(si); bar.appendChild(search);
    var sel = el('select', 'filtersel');
    sel.innerHTML = '<option value="">Class: all</option>' + CLASSES.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('');
    sel.value = st.f.cls || ''; sel.id = 'fl_roster_cls';
    sel.addEventListener('change', function () { st.f.cls = sel.value; st.page = 1; App.render(); });
    bar.appendChild(sel);
    panel.appendChild(bar);

    var filtered = rows.filter(function (r) {
      if (st.f.cls && r.cls !== st.f.cls) return false;
      if (!st.q) return true;
      return (r.name + ' ' + r.rollNo).toLowerCase().indexOf(st.q.toLowerCase()) >= 0;
    }).sort(function (a, b) {
      return a.cls === b.cls ? String(a.rollNo).localeCompare(String(b.rollNo)) : CLASSES.indexOf(a.cls) - CLASSES.indexOf(b.cls);
    });

    var wrap = el('div', 'tablewrap');
    if (!filtered.length) {
      wrap.innerHTML = '<div class="empty"><div class="e-title">' +
        (rows.length ? 'No students match that search' : 'No students loaded yet') + '</div><div>' +
        (rows.length ? 'Clear the search to see all ' + rows.length + ' students.'
          : 'Use Import students to paste a class list. Attendance entry works without this, but a roster saves typing.') +
        '</div></div>';
    } else {
      var table = el('table');
      table.innerHTML = '<thead><tr><th style="width:110px">Class</th><th style="width:170px">Roll number</th><th>Student name</th><th style="width:1%">Actions</th></tr></thead>';
      var tb = el('tbody');
      filtered.slice(0, 200).forEach(function (r) {
        var tr = el('tr');
        tr.innerHTML = '<td>' + esc(r.cls) + '</td><td class="num">' + esc(r.rollNo) + '</td><td>' + esc(r.name) + '</td>';
        var td = el('td', 'acts');
        var del = el('button', 'btn btn-sm btn-danger', 'Remove');
        del.addEventListener('click', function () {
          Store.remove('roster', r.id).then(function () { App.render(); });
        });
        td.appendChild(del); tr.appendChild(td); tb.appendChild(tr);
      });
      table.appendChild(tb);
      wrap.appendChild(table);
      if (filtered.length > 200) {
        wrap.appendChild(el('div', 'pager', 'Showing the first 200 of ' + filtered.length + ' students. Use search or the class filter to narrow the list.'));
      }
    }
    panel.appendChild(wrap);

    if (rows.length) {
      var clearRow = el('div', 'btnrow');
      var cl = el('button', 'btn btn-sm btn-danger', 'Clear roster for a class');
      cl.addEventListener('click', openRosterClear);
      clearRow.appendChild(cl);
      panel.appendChild(clearRow);
    }
    host.appendChild(panel);
  }

  function openRosterImport() {
    var body = el('div', 'stack');
    body.innerHTML =
      '<div class="field"><label for="imp_cls">Class <span class="req">*</span></label>' +
      '<select id="imp_cls">' + CLASSES.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select>' +
      '<div class="hint">Lines that already start with a class name use that class instead.</div></div>' +
      '<div class="field"><label for="imp_text">Paste the class list <span class="req">*</span></label>' +
      '<textarea id="imp_text" class="ta-mono" style="min-height:170px" placeholder="23B91A0501, Sravani K&#10;23B91A0502, Mahesh B&#10;23B91A0503 | Lakshmi P"></textarea>' +
      '<div class="hint">One student per line: roll number, then name, separated by a comma, tab or pipe. ' +
      'Three columns are read as class, roll number, name.</div></div>' +
      '<div class="field"><label for="imp_file">…or choose a CSV file</label>' +
      '<div class="filebox"><input id="imp_file" type="file" accept=".csv,.txt"></div></div>';
    var m = openModal({
      title: 'Import students', sub: 'Roll numbers are kept exactly as you enter them', body: body,
      buttons: [
        { label: 'Cancel', cls: 'btn-ghost' },
        {
          label: 'Import', cls: 'btn-primary', onClick: function (close, btn) {
            var cls = body.querySelector('#imp_cls').value;
            var text = body.querySelector('#imp_text').value;
            if (!text.trim()) { toast('Paste at least one student line.', 'bad'); return; }
            btn.disabled = true;
            doRosterImport(text, cls).then(function (n) {
              close();
              toast(n ? n + ' student' + (n === 1 ? '' : 's') + ' imported.' : 'No usable lines were found.', n ? 'ok' : 'warn');
              App.render();
            });
          }
        }
      ]
    });
    body.querySelector('#imp_file').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { body.querySelector('#imp_text').value = String(fr.result || ''); };
      fr.readAsText(f);
    });
    return m;
  }

  function doRosterImport(text, defaultCls) {
    var existing = Store.all('roster');
    var lines = text.split(/\r?\n/);
    var queue = [];
    lines.forEach(function (line) {
      var raw = line.trim();
      if (!raw) return;
      var parts = raw.split(/\s*[,\t|;]\s*/).filter(function (p) { return p !== ''; });
      if (!parts.length) return;
      var cls = defaultCls, roll, name;
      if (parts.length >= 3 && CLASSES.indexOf(parts[0]) >= 0) { cls = parts[0]; roll = parts[1]; name = parts.slice(2).join(' '); }
      else if (parts.length >= 2) { roll = parts[0]; name = parts.slice(1).join(' '); }
      else return;
      if (/^(roll|roll ?no|roll ?number|s\.?no|class)$/i.test(roll)) return;
      if (!roll || !name) return;
      if (existing.some(function (r) { return r.cls === cls && String(r.rollNo) === roll; })) return;
      if (queue.some(function (r) { return r.cls === cls && r.rollNo === roll; })) return;
      queue.push({ cls: cls, rollNo: roll, name: name });
    });
    // One request for the whole class list rather than one per student.
    return Store.putMany('roster', queue)
      .then(function (res) { return (res.records || []).length; })
      .catch(function (e) {
        toast((e && e.message) || 'The import could not be saved.', 'bad', 7000);
        return 0;
      });
  }

  function openRosterClear() {
    var body = el('div', 'field');
    body.innerHTML = '<label for="clr_cls">Class</label><select id="clr_cls">' +
      CLASSES.map(function (c) {
        var n = Store.all('roster').filter(function (r) { return r.cls === c; }).length;
        return '<option value="' + esc(c) + '">' + esc(c) + ' — ' + n + ' students</option>';
      }).join('') + '</select>' +
      '<div class="hint" style="margin-top:8px">Records already saved against these students are not affected.</div>';
    openModal({
      title: 'Clear a class roster', small: true, body: body,
      buttons: [
        { label: 'Cancel', cls: 'btn-ghost' },
        {
          label: 'Clear roster', cls: 'btn-danger', onClick: function (close) {
            var cls = body.querySelector('#clr_cls').value;
            var victims = Store.all('roster').filter(function (r) { return r.cls === cls; });
            close();
            var busy = toast('Clearing ' + cls + '…', 'busy');
            var chain = Promise.resolve();
            victims.forEach(function (v) { chain = chain.then(function () { return Store.remove('roster', v.id).catch(function () { }); }); });
            chain.then(function () { busy(); toast(cls + ' roster cleared.', 'ok'); App.render(); });
          }
        }
      ]
    });
  }

  /* reports */
  function viewReports(host) {
    var nav = App.nav.reports;
    var st = listState('reports_' + nav.module);
    host.appendChild(pageHead('Documentation', 'Reports & Export',
      'Filter any module by academic year, semester, class or assessment type, then export for accreditation files.'));

    host.appendChild(tabBar([
      { label: 'Attendance & Counselling', value: 'attendance' },
      { label: 'Assessment', value: 'assessment' },
      { label: 'Co-Curricular', value: 'cocurricular' },
      { label: 'Course Feedback', value: 'feedback' }
    ], nav.module, function (v) { nav.module = v; App.render(); }));

    var moduleId = nav.module;
    var spec = SPEC[moduleId];
    var rows = Store.all(moduleId);

    var panel = el('div', 'card pad stack');
    panel.style.marginTop = '16px';
    panel.appendChild(el('div', 'section-title', spec.label));
    panel.appendChild(el('div', 'hint',
      'The export always matches what the table below shows, including the search box and every filter.'));

    var filters = [{ k: 'acadYear', label: 'Year', options: YEARS }];
    if (moduleId === 'attendance' || moduleId === 'assessment' || moduleId === 'feedback') {
      filters.push({ k: 'sem', label: 'Semester', options: SEMS });
      filters.push({ k: 'cls', label: 'Class', options: CLASSES });
    }
    if (moduleId === 'attendance') filters.push({ k: 'type', label: 'Type', options: ['Attendance', 'Counselling'] });
    if (moduleId === 'assessment') filters.push({ k: 'kind', label: 'Assessment', options: ['FA', 'SA'] });
    if (moduleId === 'cocurricular') filters.push({ k: 'eventType', label: 'Category', options: EVENT_TYPES });

    var cols = spec.cols.slice();
    if (moduleId === 'attendance') cols = [{ k: 'cls', l: 'Class', w: '84px' }].concat(cols);
    if (moduleId === 'feedback') cols = [{ k: 'cls', l: 'Class', w: '84px' }, { k: 'sem', l: 'Semester' }].concat(cols);
    if (moduleId === 'assessment') cols = [{ k: 'kind', l: 'Type', fmt: 'kindPill', w: '74px' }].concat(cols);

    function matching() {
      return rows.filter(function (r) {
        var ok = true;
        filters.forEach(function (f) {
          var want = st.f[f.k];
          if (want && String(r[f.k] || '') !== want) ok = false;
        });
        if (!ok) return false;
        if (!st.q) return true;
        var hay = cols.map(function (c) { return r[c.k]; }).concat([r.studentName, r.rollNo, r.subject, r.remarks]).join(' ').toLowerCase();
        return hay.indexOf(st.q.toLowerCase()) >= 0;
      });
    }

    renderList(panel, {
      key: 'reports_' + moduleId,
      module: moduleId,
      rows: rows,
      cols: cols,
      filters: filters,
      defaultSort: moduleId === 'feedback' ? 'subject' : 'date',
      searchPlaceholder: 'Search every ' + spec.label.toLowerCase() + ' record…',
      emptyTitle: 'Nothing to report yet',
      emptyMsg: 'Records added in this module will be available here for filtering and export.'
    });

    var sub = [];
    filters.forEach(function (f) { if (st.f[f.k]) sub.push(f.label + ': ' + st.f[f.k]); });
    panel.appendChild(exportButtons(moduleId, matching,
      moduleId + '-records',
      spec.label + ' Records',
      sub.length ? sub.join(' · ') : 'All records'));
    panel.appendChild(el('div', 'hint',
      'The printable report opens in a new tab with the department header and an HOD signature line, and sends it straight to your printer — choose “Save as PDF” there for the accreditation file.'));
    host.appendChild(panel);
  }

  /* ------------------------------------------------------------------- app */
  App.go = function (id) {
    App.current = id;
    document.getElementById('rail').classList.remove('open');
    var scrim = document.getElementById('scrim');
    if (scrim) scrim.remove();
    App.render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  App.render = function () {
    var host = document.getElementById('view');
    if (!host) return;
    // Keep the caret where it was: re-rendering replaces the search and filter controls.
    var act = document.activeElement, keepId = null, caret = null;
    if (act && act.id && host.contains(act)) {
      keepId = act.id;
      try { caret = act.selectionStart; } catch (e) { caret = null; }
    }
    clear(host);
    document.querySelectorAll('#nav button').forEach(function (b) {
      if (b.dataset.id === App.current) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (!Store.ready) {
      host.appendChild(el('div', 'loading', '<span class="spin"></span><span>Loading saved records…</span>'));
      return;
    }
    var v = App.current;
    if (v === 'dashboard') viewDashboard(host);
    else if (v === 'attendance' || v === 'feedback') viewNested(host, v);
    else if (v === 'assessment') viewAssessment(host);
    else if (v === 'cocurricular') viewCoCurricular(host);
    else if (v === 'roster') viewRoster(host);
    else if (v === 'reports') viewReports(host);

    if (keepId) {
      var back = document.getElementById(keepId);
      if (back && host.contains(back)) {
        try {
          back.focus({ preventScroll: true });
          if (caret != null && back.setSelectionRange) back.setSelectionRange(caret, caret);
        } catch (e) { }
      }
    }
  };

  function buildNav() {
    var nav = document.getElementById('nav');
    clear(nav);
    MODULES.forEach(function (m) {
      var b = el('button', '', '<span class="ic">' + ICONS[m.icon] + '</span><span>' + esc(m.label) + '</span>');
      b.type = 'button'; b.dataset.id = m.id;
      b.addEventListener('click', function () { App.go(m.id); });
      nav.appendChild(b);
    });
    nav.appendChild(el('div', 'nav-label', 'Setup &amp; documentation'));
    TOOLS.forEach(function (m) {
      var b = el('button', '', '<span class="ic">' + ICONS[m.icon] + '</span><span>' + esc(m.label) + '</span>');
      b.type = 'button'; b.dataset.id = m.id;
      b.addEventListener('click', function () { App.go(m.id); });
      nav.appendChild(b);
    });
  }

  function setStoreChip() {
    var dot = document.getElementById('storeDot'), txt = document.getElementById('storeText');
    if (!dot || !txt) return;
    if (Store.mode === 'online') {
      dot.classList.add('on');
      txt.textContent = 'Database connected';
    } else {
      dot.classList.remove('on');
      txt.textContent = 'Database unreachable';
    }
  }

  function loadAll() {
    return Store.init().then(function () {
      setStoreChip();
      App.render();
    }).catch(function (e) {
      Store.ready = true;
      setStoreChip();
      App.render();
      if (e && e.code === 'unauthorized') { location.reload(); return; }
      toast((e && e.message) || 'Could not reach the database. Check the server settings and try Refresh.', 'bad', 9000);
    });
  }

  function startApp(name) {
    App.user = name != null ? name : App.user;
    lsSet('al_user', App.user);
    document.getElementById('login').hidden = true;
    document.getElementById('app').hidden = false;
    buildNav();
    Store.ready = false;
    App.render();
    loadAll();
  }

  function showLogin() {
    document.getElementById('app').hidden = true;
    document.getElementById('login').hidden = false;
    var n = document.getElementById('loginUser');
    if (n && !n.value) n.value = lsGet('al_user', '') || '';
  }

  function boot() {
    App.user = lsGet('al_user', '') || '';

    document.getElementById('burger').addEventListener('click', function () {
      var rail = document.getElementById('rail');
      var open = rail.classList.toggle('open');
      this.setAttribute('aria-expanded', String(open));
      var scrim = document.getElementById('scrim');
      if (open && !scrim) {
        var s = el('div', 'scrim'); s.id = 'scrim';
        s.addEventListener('click', function () {
          rail.classList.remove('open'); s.remove();
          document.getElementById('burger').setAttribute('aria-expanded', 'false');
        });
        document.body.appendChild(s);
      } else if (!open && scrim) scrim.remove();
    });

    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', function () {
      refreshBtn.disabled = true;
      var busy = toast('Reloading records…', 'busy');
      loadAll().then(function () {
        busy();
        refreshBtn.disabled = false;
        if (Store.mode === 'online') toast('Records reloaded.', 'ok');
      });
    });

    document.getElementById('signOut').addEventListener('click', function () {
      lsSet('al_auth', false);
      Store.api('/auth', { method: 'DELETE' })
        .catch(function () { })
        .then(function () { location.reload(); });
    });

    var form = document.getElementById('loginForm');
    var nameInput = document.getElementById('loginUser');
    nameInput.value = App.user;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = document.getElementById('loginPw');
      var err = document.getElementById('loginErr');
      var btn = document.getElementById('loginBtn');
      btn.disabled = true; btn.textContent = 'Signing in…';
      Store.api('/auth', {
        method: 'POST',
        body: { password: pw.value, name: nameInput.value.trim() }
      }).then(function (res) {
        btn.disabled = false; btn.textContent = 'Sign in';
        err.hidden = true;
        pw.value = '';
        pw.removeAttribute('aria-invalid');
        lsSet('al_auth', true);
        startApp(res.name || nameInput.value.trim());
      }).catch(function (ex) {
        btn.disabled = false; btn.textContent = 'Sign in';
        err.textContent = (ex && ex.code === 'bad_password')
          ? 'That password is not correct. Check with the department office.'
          : ((ex && ex.message) || 'The server could not be reached. Try again in a moment.');
        err.hidden = false;
        pw.setAttribute('aria-invalid', 'true');
        pw.focus();
      });
    });

    // Resume an existing session rather than asking for the password again.
    Store.api('/auth').then(function (res) {
      if (res && res.authenticated) startApp(res.name || App.user);
      else showLogin();
    }).catch(function () { showLogin(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
