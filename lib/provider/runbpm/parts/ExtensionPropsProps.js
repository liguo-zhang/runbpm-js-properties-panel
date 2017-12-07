'use strict';

var inputOutput = require('./implementation/ExtensionProps');

module.exports = function(group, element, bpmnFactory) {

  var inputOutputEntry = inputOutput(element, bpmnFactory);

  group.entries = group.entries.concat(inputOutputEntry.entries);

  return {
    getSelectedParameter: inputOutputEntry.getSelectedParameter
  };

};
