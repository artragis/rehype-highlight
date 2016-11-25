'use strict';

var visit = require('unist-util-visit');
var lowlight = require('lowlight');

module.exports = attacher;

function attacher(origin, options) {
  var settings = options || {};
  var detect = settings.subset !== false;
  var prefix = settings.prefix;
  var name = 'hljs';
  var pos;

  if (prefix) {
    pos = prefix.indexOf('-');
    name = pos === -1 ? prefix : prefix.slice(0, pos);
  }

  return transformer;

  function transformer(tree) {
    visit(tree, 'element', visitor);
  }

  function visitor(node, index, parent) {
    var props = node.properties;
    var result;
    var lang;

    if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
      return;
    }

    lang = language(node);

    if (lang === false || (!lang && !detect)) {
      return;
    }

    if (!props.className) {
      props.className = [];
    }

    if (props.className.indexOf(name) === -1) {
      props.className.unshift(name);
    }

    if (lang) {
      result = lowlight.highlight(lang, text(node), options);
    } else {
      result = lowlight.highlightAuto(text(node), options);

      if (result.language) {
        props.className.push('language-' + result.language);
      }
    }

    node.children = result.value;
  }
}

/* Get the text content of `node`. */
function text(node) {
  var children = node.children;
  var length = children.length;
  var result = [];
  var index = -1;
  var child;
  var value;

  while (++index < length) {
    child = children[index];
    value = '';

    if (child.children) {
      value = text(child);
    } else if (child.type === 'text') {
      value = child.value;
    }

    result[index] = value;
  }

  return result.join('');
}

/* Get the programming language of `node`. */
function language(node) {
  var className = node.properties.className || [];
  var length = className.length;
  var index = -1;
  var value;

  while (++index < length) {
    value = className[index];

    if (value === 'no-highlight' || value === 'nohighlight') {
      return false;
    }

    if (value.slice(0, 5) === 'lang-') {
      return value.slice(5);
    }

    if (value.slice(0, 9) === 'language-') {
      return value.slice(9);
    }
  }

  return null;
}
