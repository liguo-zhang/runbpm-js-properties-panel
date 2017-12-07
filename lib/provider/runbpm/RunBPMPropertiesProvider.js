'use strict';

var inherits = require('inherits');

var PropertiesActivator = require('../../PropertiesActivator');

var asyncCapableHelper = require('../../helper/AsyncCapableHelper'),
    ImplementationTypeHelper = require('../../helper/ImplementationTypeHelper');

// bpmn properties
var processProps = require('../bpmn/parts/ProcessProps'),
    eventProps = require('../bpmn/parts/EventProps'),
    linkProps = require('../bpmn/parts/LinkProps'),
    documentationProps = require('../bpmn/parts/DocumentationProps'),
    idProps = require('../bpmn/parts/IdProps'),
    nameProps = require('../bpmn/parts/NameProps');

// camunda properties
var serviceTaskDelegateProps = require('./parts/ServiceTaskDelegateProps'),
    userTaskProps = require('./parts/UserTaskProps'),
    userTaskResourceProps = require('./parts/UserTaskResourceProps'),
    asynchronousContinuationProps = require('./parts/AsynchronousContinuationProps'),
    callActivityProps = require('./parts/CallActivityProps'),
    multiInstanceProps = require('./parts/MultiInstanceLoopProps'),
    sequenceFlowProps = require('./parts/SequenceFlowProps'),
    executionListenerProps = require('./parts/ExecutionListenerProps'),
    scriptProps = require('./parts/ScriptTaskProps'),
    //taskListenerProps = require('./parts/TaskListenerProps'),
    formProps = require('./parts/FormProps'),
    startEventInitiator = require('./parts/StartEventInitiator'),
    variableMapping = require('./parts/VariableMappingProps'),
    versionTag = require('./parts/VersionTagProps');

var elementTemplateChooserProps = require('./element-templates/parts/ChooserProps'),
    elementTemplateCustomProps = require('./element-templates/parts/CustomProps');

// Input/Output
var inputOutput = require('./parts/ExtensionPropsProps'),
    inputOutputParameter = require('./parts/ExtensionPropProps');

// Connector
var connectorDetails = require('./parts/ConnectorDetailProps'),
    connectorInputOutput = require('./parts/ConnectorInputOutputProps'),
    connectorInputOutputParameter = require('./parts/ConnectorInputOutputParameterProps');

// properties
var properties = require('./parts/PropertiesProps');

// job configuration
var jobConfiguration = require('./parts/JobConfigurationProps');

// external task configuration
var externalTaskConfiguration = require('./parts/ExternalTaskConfigurationProps');

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    eventDefinitionHelper = require('../../helper/EventDefinitionHelper'),
    implementationTypeHelper = require('../../helper/ImplementationTypeHelper');

// helpers ////////////////////////////////////////

var isExternalTaskPriorityEnabled = function(element) {
  var businessObject = getBusinessObject(element);

  // show only if element is a process, a participant ...
  if (is(element, 'bpmn:Process') || is(element, 'bpmn:Participant') && businessObject.get('processRef'))  {
    return true;
  }

  var externalBo = ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element),
      isExternalTask = ImplementationTypeHelper.getImplementationType(externalBo) === 'external';

  // ... or an external task with selected external implementation type
  return !!ImplementationTypeHelper.isExternalCapable(externalBo) && isExternalTask;
};

var isJobConfigEnabled = function(element) {
  var businessObject = getBusinessObject(element);

  if (is(element, 'bpmn:Process') || is(element, 'bpmn:Participant') && businessObject.get('processRef'))  {
    return true;
  }

  // async behavior
  var bo = getBusinessObject(element);
  if (asyncCapableHelper.isAsyncBefore(bo) || asyncCapableHelper.isAsyncAfter(bo)) {
    return true;
  }

  // timer definition
  if (is(element, 'bpmn:Event'))  {
    return !!eventDefinitionHelper.getTimerEventDefinition(element);
  }

  return false;
};

var getInputOutputParameterLabel = function(param) {

  if (is(param, 'camunda:InputParameter')) {
    return 'Input Parameter';
  }

  if (is(param, 'camunda:OutputParameter')) {
    return 'Output Parameter';
  }

  return '';
};

function createGeneralTabGroups(element, bpmnFactory, elementRegistry, elementTemplates) {

  var generalGroup = {
    id: 'general',
    label: '',
    entries: []
  };
  idProps(generalGroup, element, elementRegistry);
  nameProps(generalGroup, element);
  //versionTag(generalGroup, element);
  processProps(generalGroup, element);
  elementTemplateChooserProps(generalGroup, element, elementTemplates);

  var customFieldsGroup = {
    id: 'custom-field',
    label: 'Custom Fields',
    entries: []
  };
  elementTemplateCustomProps(customFieldsGroup, element, elementTemplates, bpmnFactory);

  var detailsGroup = {
    id: 'details',
    label: '',
    entries: []
  };
  serviceTaskDelegateProps(detailsGroup, element, bpmnFactory);
  userTaskProps(detailsGroup, element, bpmnFactory);
  userTaskResourceProps(detailsGroup, element, bpmnFactory);
  scriptProps(detailsGroup, element, bpmnFactory);
  linkProps(detailsGroup, element);
  callActivityProps(detailsGroup, element, bpmnFactory);
  eventProps(detailsGroup, element, bpmnFactory, elementRegistry);
  sequenceFlowProps(detailsGroup, element, bpmnFactory);
  startEventInitiator(detailsGroup, element); // this must be the last element of the details group!

  var multiInstanceGroup = {
    id: 'multi-instance',
    label: 'Multi Instance',
    entries: []
  };
  multiInstanceProps(multiInstanceGroup, element, bpmnFactory);

  var asyncGroup = {
    id : 'async',
    label: 'Asynchronous Continuations',
    entries : []
  };
  asynchronousContinuationProps(asyncGroup, element, bpmnFactory);

  var jobConfigurationGroup = {
    id : 'job-configuration',
    label : 'Job Configuration',
    entries : [],
    enabled: isJobConfigEnabled
  };
  jobConfiguration(jobConfigurationGroup, element, bpmnFactory);

  var externalTaskConfigurationGroup = {
    id : 'externalTaskConfigurationGroup',
    label : 'External Task Configuration',
    entries : [],
    enabled: isExternalTaskPriorityEnabled
  };
  externalTaskConfiguration(externalTaskConfigurationGroup, element, bpmnFactory);

  var documentationGroup = {
    id: 'documentation',
    label: '',
    entries: []
  };
  documentationProps(documentationGroup, element, bpmnFactory);

  return [
    generalGroup,
    customFieldsGroup,
    detailsGroup,
    externalTaskConfigurationGroup,
    multiInstanceGroup,
    asyncGroup,
    jobConfigurationGroup,
    documentationGroup
  ];

}

function createVariablesTabGroups(element, bpmnFactory, elementRegistry) {
  var variablesGroup = {
    id : 'variables',
    label : '',
    entries: []
  };
  variableMapping(variablesGroup, element, bpmnFactory);

  return [
    variablesGroup
  ];
}

function createFormsTabGroups(element, bpmnFactory, elementRegistry) {
  var formGroup = {
    id : 'forms',
    label : '',
    entries: []
  };
  formProps(formGroup, element, bpmnFactory);

  return [
    formGroup
  ];
}

function createListenersTabGroups(element, bpmnFactory, elementRegistry) {

  var executionListenersGroup = {
    id : 'execution-listeners',
    label: '',
    entries: []
  };
  executionListenerProps(executionListenersGroup, element, bpmnFactory);

  // var taskListenersGroup = {
  //   id : 'task-listeners',
  //   label: 'Task Listeners',
  //   entries: []
  // };
  // taskListenerProps(taskListenersGroup, element, bpmnFactory);

  return [
    executionListenersGroup
   // taskListenersGroup
  ];
}

function createInputOutputTabGroups(element, bpmnFactory, elementRegistry) {

  var inputOutputGroup = {
    id: 'input-output',
    label: '',
    entries: []
  };

  var options = inputOutput(inputOutputGroup, element, bpmnFactory);

  var inputOutputParameterGroup = {
    id: 'input-output-parameter',
    entries: [],
    enabled: function(element, node) {
      return options.getSelectedParameter(element, node);
    },
    label: function(element, node) {
      var param = options.getSelectedParameter(element, node);
      return getInputOutputParameterLabel(param);
    }
  };

  inputOutputParameter(inputOutputParameterGroup, element, bpmnFactory, options);

  return [
    inputOutputGroup,
    inputOutputParameterGroup
  ];
}

function createConnectorTabGroups(element, bpmnFactory, elementRegistry) {
  var connectorDetailsGroup = {
    id: 'connector-details',
    label: 'Details',
    entries: []
  };

  connectorDetails(connectorDetailsGroup, element, bpmnFactory);

  var connectorInputOutputGroup = {
    id: 'connector-input-output',
    label: '',
    entries: []
  };

  var options = connectorInputOutput(connectorInputOutputGroup, element, bpmnFactory);

  var connectorInputOutputParameterGroup = {
    id: 'connector-input-output-parameter',
    entries: [],
    enabled: function(element, node) {
      return options.getSelectedParameter(element, node);
    },
    label: function(element, node) {
      var param = options.getSelectedParameter(element, node);
      return getInputOutputParameterLabel(param);
    }
  };

  connectorInputOutputParameter(connectorInputOutputParameterGroup, element, bpmnFactory, options);

  return [
    connectorDetailsGroup,
    connectorInputOutputGroup,
    connectorInputOutputParameterGroup
  ];
}

// function createExtensionElementsGroups(element, bpmnFactory, elementRegistry) {

//   var propertiesGroup = {
//     id : 'extension-elements-properties',
//     label: '',
//     entries: []
//   };
//   properties(propertiesGroup, element, bpmnFactory);

//   return [
//     propertiesGroup
//   ];
// }

// Camunda Properties Provider /////////////////////////////////////


/**
 * A properties provider for Camunda related properties.
 *
 * @param {EventBus} eventBus
 * @param {BpmnFactory} bpmnFactory
 * @param {ElementRegistry} elementRegistry
 * @param {ElementTemplates} elementTemplates
 */
function CamundaPropertiesProvider(eventBus, bpmnFactory, elementRegistry, elementTemplates) {

  PropertiesActivator.call(this, eventBus);

  this.getTabs = function(element) {

    var generalTab = {
      id: 'general',
      label: '通用',
      groups: createGeneralTabGroups(
                  element, bpmnFactory,
                  elementRegistry, elementTemplates)
    };

    var variablesTab = {
      id: 'variables',
      label: '输入输出',
      groups: createVariablesTabGroups(element, bpmnFactory, elementRegistry)
    };

    var formsTab = {
      id: 'forms',
      label: '表单',
      groups: createFormsTabGroups(element, bpmnFactory, elementRegistry)
    };

    var listenersTab = {
      id: 'listeners',
      label: '监听器',
      groups: createListenersTabGroups(element, bpmnFactory, elementRegistry)
    };

    var inputOutputTab = {
      id: 'input-output',
      label: '扩展属性',
      groups: createInputOutputTabGroups(element, bpmnFactory, elementRegistry)
    };

    var connectorTab = {
      id: 'connector',
      label: 'Connector',
      groups: createConnectorTabGroups(element, bpmnFactory, elementRegistry),
      enabled: function(element) {
        var bo = implementationTypeHelper.getServiceTaskLikeBusinessObject(element);
        return bo && implementationTypeHelper.getImplementationType(bo) === 'connector';
      }
    };

    // var extensionsTab = {
    //   id: 'extension-elements',
    //   label: '扩展属性',
    //   groups: createExtensionElementsGroups(element, bpmnFactory, elementRegistry)
    // };

    return [
      generalTab,
      variablesTab,
      connectorTab,
      formsTab,
      listenersTab,
      inputOutputTab
      //extensionsTab
    ];
  };

}

CamundaPropertiesProvider.$inject = [
  'eventBus',
  'bpmnFactory',
  'elementRegistry',
  'elementTemplates'
];

inherits(CamundaPropertiesProvider, PropertiesActivator);

module.exports = CamundaPropertiesProvider;
