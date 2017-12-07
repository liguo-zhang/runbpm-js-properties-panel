'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
  domQuery = require('min-dom/lib/query'),
  cmdHelper = require('../../../helper/CmdHelper'),
  elementHelper = require('../../../helper/ElementHelper'),
  forEach = require('lodash/collection/forEach'),
  domify = require('min-dom/lib/domify'),
  utils = require('../../../Utils'),

  script = require('./implementation/Script')('scriptFormat', 'value', true);


function createListenerTemplate(id, isProcess,isFlowNode,isUserTask) {
  console.log("isProcess:"+isProcess);
  return '<div class="djs-listener-area" data-scope>' +
            '<button class="clear" data-action="removeListener"><span>X</span></button>' +

            '<div class="pp-row">' +
              '<label for="cam-event-type-'+id+'">事件类型</label>' +
                  '<div class="pp-field-wrapper">' +
                    '<select id="cam-event-type-'+id+'" name="eventType" data-value>' +
                    (isProcess?
                      '<option value="beforeProcessInstanceCreated">beforeProcessInstanceCreated</option>' +
                      '<option value="afterProcessInstanceCreated">afterProcessInstanceCreated</option>' +
                      '<option value="beforeProcessInstanceStarted">beforeProcessInstanceStarted</option>' +
                      '<option value="afterProcessInstanceStarted">afterProcessInstanceStarted</option>' +
                      '<option value="beforeProcessInstanceTerminated">beforeProcessInstanceTerminated</option>' +
                      '<option value="afterProcessInstanceTerminated">afterProcessInstanceTerminated</option>' +
                      '<option value="beforeProcessInstanceSuspended">beforeProcessInstanceSuspended</option>' +
                      '<option value="afterProcessInstanceSuspended">afterProcessInstanceSuspended</option>' +
                      '<option value="beforeProcessInstanceResumed">beforeProcessInstanceResumed</option>' +
                      '<option value="afterProcessInstanceResume">afterProcessInstanceResume</option>' +
                      '<option value="beforeProcessInstanceCompleted">beforeProcessInstanceCompleted</option>' +
                      '<option value="afterProcessInstanceCompleted">afterProcessInstanceCompleted</option>' 
                      :''
                      )+
                    (isFlowNode?
                      '<option value="beforeActivityInstanceStarted">beforeActivityInstanceStarted</option>' +
                      '<option value="afterActivityInstanceStarted">afterActivityInstanceStarted</option>' +
                      '<option value="beforeActivityInstanceTerminated">beforeActivityInstanceTerminated</option>' +
                      '<option value="afterActivityInstanceTerminated">afterActivityInstanceTerminated</option>' +
                      '<option value="beforeActivityInstanceSuspended">beforeActivityInstanceSuspended</option>' +
                      '<option value="afterActivityInstanceSuspended">afterActivityInstanceSuspended</option>' +
                      '<option value="beforeActivityInstanceResumed">beforeActivityInstanceResumed</option>' +
                      '<option value="afterActivityInstanceResumed">afterActivityInstanceResumed</option>' +
                      '<option value="beforeActivityInstanceCompleted">beforeActivityInstanceCompleted</option>' +
                      '<option value="afterActivityInstanceCompleted">afterActivityInstanceCompleted</option>' +
                      '<option value="beforeActivityInstanceTerminateAndTargeted">beforeActivityInstanceTerminateAndTargeted</option>' +
                      '<option value="afterActivityInstanceTerminateAndTargeted">afterActivityInstanceTerminateAndTargeted</option>' 
                      :''
                      )+
                     (isUserTask?
                      '<option value="beforeUserTaskStarted">beforeUserTaskStarted</option>' +
                      '<option value="afterUserTaskStarted">afterUserTaskStarted</option>' +
                      '<option value="beforeUserTaskClaimed">beforeUserTaskClaimed</option>' +
                      '<option value="afterUserTaskClaimed">afterUserTaskClaimed</option>' +
                      '<option value="beforeUserTaskTerminated">beforeUserTaskTerminated</option>' +
                      '<option value="afterUserTaskTerminated">afterUserTaskTerminated</option>' +
                      '<option value="beforeUserTaskSuspended">beforeUserTaskSuspended</option>' +
                      '<option value="afterUserTaskSuspended">afterUserTaskSuspended</option>' +
                      '<option value="beforeUserTaskResumed">beforeUserTaskResumed</option>' +
                      '<option value="afterUserTaskResumed">afterUserTaskResumed</option>' +
                      '<option value="beforeUserTaskCompleted">beforeUserTaskCompleted</option>' +
                      '<option value="afterUserTaskCompleted">afterUserTaskCompleted</option>' +
                      '<option value="beforeUserTaskReassigned">beforeUserTaskReassigned</option>' +
                      '<option value="afterUserTaskReassigned">afterUserTaskReassigned</option>' 
                      :''
                      )+
                    '</select>' +
                  '</div>'+
            '</div>' +

            '<div class="pp-row" style="display:none">' +
              '<label for="cam-listener-type-'+id+'">固定为Java Class</label>' +
              '<div class="pp-field-wrapper">' +
                '<select id="cam-listener-type-'+id+'" name="listenerType" data-value>' +
                  '<option value="class">Java Class</option>' +
                  '<option value="expression">Expression</option>' +
                  '<option value="delegateExpression">Delegate Expression</option>' +
                  '<option value="script">Script</option>' +
                '</select>' +
              '</div>' +
            '</div>' +

            '<div class="pp-row">' +
              '<div data-show="isNotScript">' +
                '<label for="camunda-listener-val-'+id+'">' +
                  '<span data-show="isJavaClass">类路径以及类名</span>' +
                  '<span data-show="isExpression">Expression</span>' +
                  '<span data-show="isDelegateExpression">Delegate Expression</span>' +
                '</label>' +
                '<div class="pp-field-wrapper">' +
                  '<input id="camunda-listener-val-'+id+'" type="text" name="listenerValue" />' +
                  '<button class="clear" data-action="clearListenerValue" data-show="canClearListenerValue">' +
                    '<span>X</span>' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>'+

            '<div data-show="isScript">' +
              script.template +
            '</div>'+

          '</div>';
}

function getItem(element, bo) {
   // read values from xml:
  var boExpression = bo.get('expression'),
      boDelegate = bo.get('delegateExpression'),
      boClass = bo.get('class'),
      boEvent = bo.get('event'),
      boScript = bo.script;

  var values = {},
    listenerType = '';

  if(typeof boExpression !== 'undefined') {
    listenerType = 'expression';
    values.listenerValue = boExpression;
  }
  else if(typeof boDelegate !== 'undefined') {
    listenerType = 'delegateExpression';
    values.listenerValue = boDelegate;
  }
  else if(typeof boClass !== 'undefined') {
    listenerType = 'class';
    values.listenerValue = boClass;
  }
  else if (typeof boScript !== 'undefined') {
    listenerType = 'script';
    values = script.get(element, boScript);
  }

  values.listenerType = listenerType;
  values.eventType = boEvent;

  return values;
}

function setEmpty(update) {
  update.class = undefined;
  update.expression = undefined;
  update.delegateExpression = undefined;
  update.event = undefined;
  update.script = undefined;
}

function createExecutionListener(element, values, extensionElements, executionListenerList, bpmnFactory) {
  // add execution listener values to extension elements values
  forEach(values, function(value) {
    var update = {};
    setEmpty(update);
    update.event = value.eventType;

    var executionListener = elementHelper.createElement('runbpm:ExecutionListener',
                                                     update, extensionElements, bpmnFactory);

    if (value.listenerType === 'script') {
      var scriptProps = script.set(element, value);
      executionListener.script = elementHelper.createElement('runbpm:Script',
                                                     scriptProps, executionListener, bpmnFactory);
    }
    else {
      executionListener[value.listenerType] = value.listenerValue || '';
    }

    executionListenerList.push(executionListener);
  });

}

module.exports = function(group, element, bpmnFactory) {

  var bo;
  var lastIdx = 0;

  if (is(element, 'bpmn:FlowNode')||is(element, 'bpmn:Process')) {
    bo = getBusinessObject(element);
  }

  if (!bo) {
    return;
  }

  var isProcess = is(element, 'bpmn:Process');
  var isFlowNode = is(element, 'bpmn:FlowNode');
  var isUserTask = is(element, 'bpmn:UserTask');

  group.entries.push({
    id: 'execution-listeners',
    description: 'Configure execution listener.',
    label: 'Listener',
    html: '<div class="cam-add-listener">' +
              '<label for="addListener">增加事件监听 </label>' +
              '<button class="add" id="addListener" data-action="addListener"><span>+</span></button>' +
            '</div>' +
            '<div data-list-entry-container></div>',

    createListEntryTemplate: function(value, idx) {
      lastIdx = idx;
      return createListenerTemplate(idx, isProcess,isFlowNode,isUserTask);
    },

    get: function (element, propertyName) {
      var values = [];

      if (!!bo.extensionElements) {
        var extensionElementsValues = getBusinessObject(element).extensionElements.values;
        forEach(extensionElementsValues, function(extensionElement) {
          if (typeof extensionElement.$instanceOf === 'function' && is(extensionElement, 'runbpm:ExecutionListener')) {
            values.push(getItem(element, extensionElement));
          }
        });
      }

      return values;
    },

    set: function (element, values, containerElement) {
      var cmd;

      var extensionElements = bo.extensionElements;
      var isExtensionElementsNew = false;

      // if (isSequenceFlow) {
      //   forEach(values, function(value) {
      //     value.eventType = 'take';
      //   });
      // }

      if (!extensionElements) {
        isExtensionElementsNew = true;
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements',
                                                        { values: [] }, bo, bpmnFactory);
      }

      if (isExtensionElementsNew) {
        var extensionValues = extensionElements.get('values');
        createExecutionListener(element, values, extensionElements, extensionValues, bpmnFactory);

        cmd = cmdHelper.updateProperties(element, { extensionElements: extensionElements });
      } else {

        // remove all existing execution listeners
        var objectsToRemove = [];
        forEach(extensionElements.get('values'), function(extensionElement) {
          if (is(extensionElement, 'runbpm:ExecutionListener')) {
            objectsToRemove.push(extensionElement);
          }
        });

        // add all the listeners
        var objectsToAdd = [];
        createExecutionListener(element, values, extensionElements, objectsToAdd, bpmnFactory);

        cmd = cmdHelper.addAndRemoveElementsFromList(element, extensionElements, 'values', 'extensionElements',
                                                      objectsToAdd, objectsToRemove);
      }
      return cmd;
    },

    validateListItem: function(element, values) {
      var validationResult = {};

      if(values.listenerType === 'script') {
        validationResult = script.validate(element, values);
      }
      else if(!values.listenerValue) {
        validationResult.listenerValue = "Must provide a value";
      }

      return validationResult;
    },

    addListener: function(element, inputNode) {
      var listenerContainer = domQuery('[data-list-entry-container]', inputNode);
      lastIdx++;
      var template = domify(createListenerTemplate(lastIdx, isProcess,isFlowNode,isUserTask));
      listenerContainer.appendChild(template);
      return true;
    },

    removeListener: function(element, entryNode, btnNode, scopeNode) {
      scopeNode.parentElement.removeChild(scopeNode);
      return true;
    },

    clearListenerValue:  function(element, entryNode, btnNode, scopeNode) {
      var input = domQuery('input[name=listenerValue]', scopeNode);
      input.value = '';
      return true;
    },

    canClearListenerValue: function(element, entryNode, btnNode, scopeNode) {
      var input = domQuery('input[name=listenerValue]', scopeNode);
      return input.value !== '';
    },

    isExpression: function(element, entryNode, btnNode, scopeNode) {
      var type = utils.selectedType('select[name=listenerType]', scopeNode);
      return type === 'expression';
    },

    isJavaClass: function(element, entryNode, btnNode, scopeNode) {
      var type = utils.selectedType('select[name=listenerType]', scopeNode);
      return type === 'class';
    },

    isDelegateExpression: function(element, entryNode, btnNode, scopeNode) {
      var type = utils.selectedType('select[name=listenerType]', scopeNode);
      return type === 'delegateExpression';
    },

    isScript: function(element, entryNode, btnNode, scopeNode) {
      var type = utils.selectedType('select[name=listenerType]', scopeNode);
      return type === 'script';
    },

    isNotScript: function(element, entryNode, btnNode, scopeNode) {
      var type = utils.selectedType('select[name=listenerType]', scopeNode);
      return type !== 'script';
    },

    script: script,

    cssClasses: ['pp-textfield']
   });

};
