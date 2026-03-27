sap.ui.define([
		"./services",
		"./configuration", "./dataformatter",
		"./utility"
	], function (Services, Config, Formatter, Utility) {
		"use strict";
		return {
			/**
			 * On Enter Date Range for Assignment
			 */
			validateDateRangeAssignment: function (component) {
				var assignmentModel = component.modelAssignment("AssignmentRequest");
				var validFrom = assignmentModel.getProperty("/VALID_FROM");
				var validTo = assignmentModel.getProperty("/VALID_TO");
				var isDelimitScenario = assignmentModel.getProperty("/isDelimitScenario");

				var message = "";
				//Validate Start and End Date
				var diffDays;
				if (validFrom && validTo) {
					diffDays = Formatter.getDaysDiff(validFrom, validTo);
					message = (diffDays == 0) ?
						"Valid From and To Date can't be same" : (diffDays < 0) ? "Please select proper Date Range" : "";
				}

				if (isDelimitScenario) {
					validFrom = new Date();
				}
				return message;
			},
			/**
			 * Validate a Request Upon Submission
			 */
			validateAssignmentRequest: function (component) {
				component.closeMessageStrip("assignmentMessageStripId", "AssignNewDialog");
				var assignObj = component.modelAssignment("AssignmentRequest").getData();
				var validationMsg = "";

				if (assignObj && assignObj.PROCESS_CODE && assignObj.ULU && assignObj.FDLU && assignObj.STAFF_USER_GRP && assignObj.STAFF_NUSNET_ID &&
					assignObj.VALID_FROM && assignObj.VALID_TO) {
					validationMsg = this.validateDateRangeAssignment(component);
				} else {
					validationMsg = "Please enter all the (*) required fields";
				}

				if (validationMsg) {
					component.showMessageStrip("assignmentMessageStripId", validationMsg, "E", "AssignNewDialog");
				}
				return validationMsg;
			}

		};
	},
	true);