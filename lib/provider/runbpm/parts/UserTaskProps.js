'use strict';


var is = require('bpmn-js/lib/util/ModelUtil').is,
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
  domQuery = require('min-dom/lib/query'),
  cmdHelper = require('../../../helper/CmdHelper'),
  elementHelper = require('../../../helper/ElementHelper'),
  domify = require('min-dom/lib/domify'),
  forEach = require('lodash/collection/forEach'),
  entryFactory = require('../../../factory/EntryFactory');

function createResourceExpressionTemplate(id) {
  return '<div class="djs-listener-area" data-scope>' +
            '<button class="clear" data-action="removeResourceExpression"><span>X</span></button>' +
            '<div class="pp-row">' +
              '<label for="cam-listener-type-'+id+'">类型</label>' +
              '<div class="pp-field-wrapper">' +
                '<select id="cam-listener-type-'+id+'" name="type" data-value>' +
                  '<option value="user">单人</option>' +
                  '<option value="group">用户组</option>' +
                  '<option value="user_variable">动态单人</option>' +
                  '<option value="group_variable">动态用户组</option>' +
                  '<option value="handler_bean_id">Spring Bean</option>' +
                  '<option value="handler_bean_id_variable">动态Spring Bean</option>' +
                  '<option value="handler_bean_class">类路径</option>' +
                  '<option value="handler_bean_class_variable">动态类路径</option>' +
                '</select>' +
              '</div>' +
            '</div>' +

            '<div class="pp-row">' +
              '<div>' +
                '<div class="pp-field-wrapper">' +
                  '<input id="camunda-listener-val-'+id+'" type="text" name="bodyValue" />' +
                '</div>' +
              '</div>' +
            '</div>'+
          '</div>';
}

//values是视图层的数据
function createResourceExpression(element, values, resourceAssignment, resourceExpressions,bpmnFactory) {
  // add task listener values to extension elements values
  forEach(values, function(value) {
    var update = {};
    update.type = value.type;
    update.body= value.bodyValue;

    var resourceExpression = elementHelper.createElement('runbpm:ResourceExpression',
                                                     update, resourceAssignment, bpmnFactory);

    resourceExpressions.push(resourceExpression);
  });
}

function getItem(resourceExpression) {
   // read values from xml:
  var values = {};

  values.bodyValue = resourceExpression.get('body');
  values.type = resourceExpression.type;
  //console.log("getItem-----------------:"+JSON.stringify(values));
  return values;
}

module.exports = function(group, element,bpmnFactory) {
  var bo;
  var lastIdx = 0;
  if (is(element, 'bpmn:UserTask')) {
    bo = getBusinessObject(element);
  }

  if (!bo) {
    return;
  }

  //console.log(JSON.stringify(bo));
  //console.log(bo.extensionElements);

  group.entries.push({
    id: 'UserTaskProps',
    description: 'Configure Resource Expression',
    label: '任务分配',
    html:  '<div class="cam-add-listener">' +
            '<label for="addResourceExpression">增加人员</label>' +
            '<button class="add" id="addResourceExpression" data-action="addResourceExpression"><span>+</span></button>' +
          '</div>' +
          '<div data-list-entry-container></div>',

    createListEntryTemplate: function(value, idx) {
      lastIdx = idx;
      return createResourceExpressionTemplate(idx);
    },

    get: function (element, propertyName) {
      var values = [];

      if (!!bo.extensionElements) {
        var resource = getBusinessObject(element).extensionElements.resource;
        if(!!resource){
          var resourceAssignment = resource.resourceAssignment;
          if(!!resourceAssignment){
            var resourceExpressions = resourceAssignment.values;
            forEach(resourceExpressions, function(resourceExpressionElement) {
                values.push(getItem(resourceExpressionElement));
            });
          }
        }
      }
      return values;
    },

    set: function (element, values, containerElement) {
      var cmd;

      var isExtensionElementsNew = false;
      var extensionElements = bo.extensionElements;

      // console.log("enter set element:"+JSON.stringify(element));
      // console.log("enter set bo:"+JSON.stringify(bo));

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

      if(!extensionElements.resource.resourceAssignment) {
        isExtensionElementsNew = true;
        extensionElements.resource.resourceAssignment =   elementHelper.createElement('runbpm:ResourceAssignment',
                                                        { values: [] }, extensionElements.resource, bpmnFactory);
      }
      //--------//fill extensionElements

      if (isExtensionElementsNew) {
        extensionElements.resource.resourceAssignment.resourceExpressions = 
                extensionElements.resource.resourceAssignment.get('values'); // 肯定为空  [];
        createResourceExpression(element, values, extensionElements.resource.resourceAssignment, 
                extensionElements.resource.resourceAssignment.resourceExpressions, bpmnFactory);

        cmd = cmdHelper.updateProperties(element, { extensionElements: extensionElements });

      } else {

        // remove all existing 
        var objectsToRemove = [];
        forEach(bo.extensionElements.resource.resourceAssignment.get('values'), function(resourceExpressions) {
            objectsToRemove.push(resourceExpressions);
        });

        // add all the listeners
        var objectsToAdd = [];
        createResourceExpression(element, values, extensionElements.resource.resourceAssignment,
                objectsToAdd, bpmnFactory);

        cmd = cmdHelper.addAndRemoveElementsFromList(element, extensionElements.resource.resourceAssignment, 'values', 'resourceAssignment',
                                                      objectsToAdd, objectsToRemove);

      }

      return cmd;
    },

    addResourceExpression: function(element, inputNode) {
      //console.log("addResourceExpression");
      var listenerContainer = domQuery('[data-list-entry-container]', inputNode);
      lastIdx++;
      var template = domify(createResourceExpressionTemplate(lastIdx));
      listenerContainer.appendChild(template);
      return true;
    },

    removeResourceExpression: function(element, entryNode, btnNode, scopeNode) {
      scopeNode.parentElement.removeChild(scopeNode);
      return true;
    },
  });

};
