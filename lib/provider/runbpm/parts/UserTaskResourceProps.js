'use strict';


var is = require('bpmn-js/lib/util/ModelUtil').is,
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
  domQuery = require('min-dom/lib/query'),
  cmdHelper = require('../../../helper/CmdHelper'),
  elementHelper = require('../../../helper/ElementHelper'),
  domify = require('min-dom/lib/domify'),
  forEach = require('lodash/collection/forEach'),
  entryFactory = require('../../../factory/EntryFactory');




module.exports = function(group, element,bpmnFactory) {
  var bo;
  var lastIdx = 0;
  if (is(element, 'bpmn:UserTask')) {
    bo = getBusinessObject(element);
  }

  if (!bo) {
    return;
  }

  // console.log(JSON.stringify(bo));
  // console.log(bo.extensionElements);

  group.entries.push({
    id: 'UserTaskResourceProps',
    description: 'Configure Resource Expression',
    label: '任务分配',
    html: '<div class="pp-row">' +
            '<label for="camunda-form-type">分配策略</label>' +
            '<div class="pp-field-wrapper">' +
              '<select id="camunda-form-type" name="resourcePolicyType" data-value>' +
                '<option value="single">单人</option>' +
                '<option value="multi">会签</option>' +
              '</select>' +
            '</div>' +
          '</div>',

    get: function (element, propertyName) {
      var values = {};

      if (!!bo.extensionElements) {
        var resource = getBusinessObject(element).extensionElements.resource;
        if(!!resource){
          var resourcePolicy = resource.resourcePolicy;
          if(!!resourcePolicy){
            values.resourcePolicyType = resourcePolicy.type;
          }
        }
      }
      return values;
    },

    set: function (element, values, containerElement) {
      var cmd;
      var update = {};
      update.type=values.resourcePolicyType;

      var isExtensionElementsNew = false;
      var extensionElements = bo.extensionElements;
      

      //--------fill extensionElements
      if (!extensionElements){
        isExtensionElementsNew = true;
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements',
                                                        {}, bo, bpmnFactory);
      } 

      if(!extensionElements.resource){
        isExtensionElementsNew = true;
        extensionElements.resource =  elementHelper.createElement('runbpm:Resource',
                                                        {}, extensionElements, bpmnFactory);
      }

      if(!extensionElements.resource.resourcePolicy) {
        isExtensionElementsNew = true;
        extensionElements.resource.resourcePolicy =   elementHelper.createElement('runbpm:ResourcePolicy',
                                                        update, extensionElements.resource, bpmnFactory);
      }
      //--------//fill extensionElements
      if (isExtensionElementsNew) {
        cmd = cmdHelper.updateProperties(element, { extensionElements: extensionElements });
      } else{
        cmd = cmdHelper.updateBusinessObject(element, extensionElements.resource.resourcePolicy, update);  
      }
      

      return cmd;
    }
  });

};
