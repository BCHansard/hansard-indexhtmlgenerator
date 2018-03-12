"use strict";

(function () {
  var templates;

  window.tk = toolkit.create({
    debug: true
  });

  templates = {
    xref: function xref(_xref) {
      var item;
      return tk.template.tag(
        "div",
        { "class": "x-ref" },
        tk.template.tag(
          "em",
          null,
          _xref.prefix
        ),
        tk.template.tag(
          "ul",
          null,
          function () {
            var i, len, ref, results;
            ref = _xref.content;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              item = ref[i];
              results.push(tk.template.tag(
                "li",
                null,
                tk.template.tag(
                  "a",
                  { href: '#' + item.target },
                  item.label
                )
              ));
            }
            return results;
          }()
        )
      );
    },
    locator: function locator(_locator) {
      return tk.template.tag(
        "span",
        { "class": "locator" },
        _locator.target
      );
    },
    level: function level(_level) {
      var locator, nextLevel, xref;
      return tk.template.tag(
        "div",
        { "class": "level level-" + _level.level, id: _level.id },
        tk.template.tag(
          "div",
          { "class": "title " + _level.heading_type },
          _level.heading
        ),
        _level.content.length > 0 && _level.level === 1 ? tk.template.tag(
          "div",
          { "class": "info" },
          _level.content.length + ' ' + (_level.content.length === 1 ? 'entry' : 'entries')
        ) : void 0,
        _level.xrefs.length ? tk.template.tag(
          "div",
          { "class": "x-refs" },
          function () {
            var i, len, ref, results;
            ref = _level.xrefs;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              xref = ref[i];
              results.push(templates.xref(xref));
            }
            return results;
          }()
        ) : void 0,
        _level.content.length ? tk.template.tag(
          "div",
          { "class": "content" },
          function () {
            var i, len, ref, results;
            ref = _level.content;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              nextLevel = ref[i];
              results.push(templates.level(nextLevel));
            }
            return results;
          }()
        ) : void 0,
        _level.locators.length ? tk.template.tag(
          "div",
          { "class": "locators" },
          function () {
            var i, len, ref, results;
            ref = _level.locators;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              locator = ref[i];
              results.push(templates.locator(locator));
            }
            return results;
          }()
        ) : void 0
      );
    },
    letter: function letter(_letter) {
      var l1;
      return tk.template.tag(
        "div",
        { "class": "letter" },
        tk.template.tag(
          "h1",
          null,
          _letter.letter
        ),
        tk.template.tag(
          "div",
          { "class": "content" },
          function () {
            var i, len, ref, results;
            ref = _letter.content;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              l1 = ref[i];
              if (!l1.filter) {
                results.push(templates.level(l1));
              }
            }
            return results;
          }()
        )
      );
    }
  };

  tk.init(function () {
    var el, start;
    start = tk.time();
    el = tk.template(templates.letter).source(data).render();
    tk.log('Rendered in ' + (tk.time() - start) + 'ms');
    return tk('body').append(tk.tag('div', {
      class: 'index'
    })).append(tk.tag('img', {
      class: 'brand',
      src: 'brand.svg'
    })).back().append(el);
  });
}).call(undefined);