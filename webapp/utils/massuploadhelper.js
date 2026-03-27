sap.ui.define([
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel",
	"./services",
	"./utility",
	"./configuration",
	"./dataformatter",
	'sap/ui/export/library',
], function (MessageBox, Filter, FilterOperator, FilterType, Fragment, Sorter, JSONModel, Services, Utility, Config, Formatter,
	exportLibrary) {
	"use strict";
	var EdmType = exportLibrary.EdmType;

	return {
		_onPressMassUploadTemplate: function (component, assignmentModel) {
			try {
				component.showBusyIndicator();
				component.closeMessageStrip("assignmentMessageStripId", "AssignNewDialog");
				var userGrp = component.AppModel.getProperty("/userGrp");
				var fileUploader, ulu = "NA",
					fdlu = "NA";
				fileUploader = component.getUIControl("adminMassUploadId", "AssignNewDialog");
				var file = fileUploader.oFileUpload.files[0];
				var message = "";
				var assignmentRequest = assignmentModel.getData();

				if (!assignmentRequest.PROCESS_CODE) {
					message = "Please select Process Code";
				}

				if (userGrp && userGrp === component.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
					if (!(assignmentRequest.PROCESS_CODE /*&& assignmentRequest.ULU && assignmentRequest.FDLU*/ )) {
						message += (message) ? "\n" : "";
						message += "Please select all (*)required fields";
					}
					ulu = assignmentRequest.ULU;
					fdlu = assignmentRequest.FDLU;
				}

				if (!file) { //File Validation
					message += (message) ? "\n" : "";
					message += "Please upload file....!!";
				}

				if (!assignmentRequest.noOfHeaderRows || assignmentRequest.noOfHeaderRows === 0 || isNaN(parseInt(assignmentRequest.noOfHeaderRows))) {
					message += (message) ? "\n" : "";
					message += "Please provide No.of Header Rows.";
				}

				if (message) {
					component.showMessageStrip("assignmentMessageStripId", message, "E", "AssignNewDialog");
					return;
				}

				var form = new FormData();
				form.append("matrixFile", file, file.name);
				form.append("requestorGrp", userGrp);
				form.append("ulu", ulu);
				form.append("fdlu", fdlu);
				form.append("processCode", assignmentRequest.PROCESS_CODE);
				form.append("noOfHeaderRows", assignmentRequest.noOfHeaderRows);
				var oHeaders = Utility._headerToken(component);
				delete oHeaders['Content-Type'];
				var settings = {
					"url": Config.dbOperations.matrixUploadExcel,
					"method": "POST",
					"timeout": 0,
					"headers": oHeaders,
					"processData": false,
					"mimeType": "multipart/form-data",
					"contentType": false,
					"data": form
				};
				$.ajax(settings)
					.done(function (response) {
						try {
							var parseResponse = JSON.parse(response);
							component.AppModel.setProperty("/excelResponse", parseResponse.response);
							if (!parseResponse.error) { //successfully upload
								//aggregate error messages for a particular claim request row				
								var matrixPayload = parseResponse.response.matrix_payload;
								for (var i = 0; i < matrixPayload.length; i++) {
									var itemOfEachRow = matrixPayload[i];
									Formatter._formatForExportMassUploadRow(itemOfEachRow);
									//	var itemSetItem = {};
									var aErrorMessages = (itemOfEachRow.validationResults) ? itemOfEachRow.validationResults : itemOfEachRow.validationResults=[];
									var errorMessageOfEachRow = "";
									for (var j = 0; j < aErrorMessages.length; j++) {
										var itemOfEachErrorMessage = aErrorMessages[j];
										if (j === 0) {
											errorMessageOfEachRow = "(".concat((j + 1), ")").concat(" ", itemOfEachErrorMessage.message);
										} else {
											errorMessageOfEachRow = errorMessageOfEachRow.concat(". (", (j + 1)).concat(") ", itemOfEachErrorMessage.message);
										}
									}
									itemOfEachRow.errorMessage = errorMessageOfEachRow;
								}
								//
								//show the backend mass upload response in a fragment
								if (!component._oMassUploadResponse) {
									component._oMassUploadResponse = sap.ui.xmlfragment(component.createId("MassMatrixUploadOverviewFragment"),
										"nus.edu.sg.approvermatrix.view.fragments.MassMatrixUploadResponse", component);
									component.getView().addDependent(component._oMassUploadResponse);
									component._oMassUploadResponse.setEscapeHandler(function () {
										return;
									});
									component._oMassUploadResponse.open();
								}
								// close dialog
								component.closeAssignmentDialog();

							} else { //during failed
								component.showMessageStrip("assignmentMessageStripId",
									"Failed to upload the Matrix data. Please correct the file and upload it again..!!", "E", "AssignNewDialog");
							}
						} catch (oError) {
							component.showMessageStrip("assignmentMessageStripId",
								"Failed to upload claim data.", "E", "AssignNewDialog");
						} finally {
							// component.hideBusyIndicator();
						}
					}.bind(component))
					.fail(function (response) {
						var parseResponse = JSON.parse(response.responseText);
						if (parseResponse.error) {
							MessageBox.error(parseResponse.message);
						}
						// alert("error");
					}.bind(component))
					.always(function () {
						component.hideBusyIndicator();
					}.bind(component));
			} catch (oError) {
				MessageBox.error("Data Upload Failed..!!");
			} finally {
				component.hideBusyIndicator();
			}

		},
		/*	_createColumnConfig: function () {
				return [{
					label: 'S.No',
					property: 'STAFF_NUSNET_ID',
					width: '10'
				},{
					label: 'Staff ID',
					property: 'STAFF_NUSNET_ID',
					width: '10'
				}, {
					label: 'Claim Request Type',
					property: 'CLAIM_REQUEST_TYPE',
					width: '10'
				}, {
					label: 'Start Date',
					property: 'CLAIM_START_DATE',
					width: '10'
				}, {
					label: 'End Date',
					property: 'CLAIM_END_DATE',
					width: '10'
				}, {
					label: 'Start Time',
					property: 'START_TIME',
					width: '10'
				}, {
					label: 'End Time',
					property: 'END_TIME',
					width: '10'
				}, {
					label: 'Hours / Unit',
					property: ['HOURS_UNIT'],
					width: '10'
				}, {
					label: 'Rate Type',
					property: 'RATE_TYPE',
					width: '18'
				}, {
					label: 'Rate Amount',
					property: 'RATE_TYPE_AMOUNT',
					width: '10'
				}, {
					label: 'Discrepency (in Amount)',
					property: 'DISC_RATETYPE_AMOUNT',
					width: '10'
				}, {
					label: 'Verifier',
					property: 'VERIFIER_STAFF_FULL_NAME',
					width: '10'
				}, {
					label: 'Additional Approver 1',
					property: 'ADDITIONAL_APP_1_STAFF_FULL_NAME',
					width: '10'
				}, {
					label: 'Additional Approver 2',
					property: 'ADDITIONAL_APP_2_STAFF_FULL_NAME',
					width: '10'
				}, {
					label: 'WBS',
					property: 'WBS',
					width: '10'
				}, {
					label: 'Attachment Required',
					property: 'ATTACHMENT_REQUIRED',
					width: '10'
				}, {
					label: 'Remarks',
					property: 'REMARKS',
					width: '10'
				}, {
					label: 'Error',
					property: 'errorMessage',
					width: '10'
				}];
			},*/
		_createColumnConfig: function () {
			return [{
				label: 'S.No',
				property: 'S_NO',
				type: EdmType.Number,
				width: '10'
			}, {
				label: 'Staff ID',
				property: 'STF_NUMBER',
				type: EdmType.Number,
				width: '10'
			}, {
				label: 'Hours / Unit',
				property: ['HOURS_UNIT'],
				type: EdmType.Number,
				width: '10'
			}, {
				label: 'Rate Type',
				property: 'RATE_TYPE',
				width: '18'
			}, {
				label: 'Rate Amount / Discrepency Amount',
				type: EdmType.Number,
				property: 'RATE_TYPE_AMOUNT',
				scale: 2,
				width: '10'
			}, {
				label: 'Verifier',
				property: 'VERIFIER_STAFF_ID',
				type: EdmType.Number,
				width: '10'
			}, {
				label: 'Additional Approver 1',
				property: 'ADDITIONAL_APP_1_STAFF_ID',
				type: EdmType.Number,
				width: '10'
			}, {
				label: 'Additional Approver 2',
				property: 'ADDITIONAL_APP_2_STAFF_ID',
				type: EdmType.Number,
				width: '10'
			}, {
				label: 'WBS Element',
				property: 'WBS',
				width: '10'
			}, {
				label: 'Attachment Required',
				property: 'ATTACHMENT_REQUIRED',
				width: '10'
			}, {
				label: 'Remarks',
				property: 'REMARKS',
				width: '10'
			}, {
				label: 'Error',
				property: 'errorMessage',
				width: '10'
			}];
		},
		_onMessagePopoverPress: function (oEvent, component) {
			var oView = component.getView();
			var oSourceControl = oEvent.getSource();
			var sPath = oSourceControl.getBindingContext("AppModel").getPath();
			if (!component._pMessagePopover) {
				component._pMessagePopover = sap.ui.xmlfragment("fragErrMessPopOver",
					"nus.edu.sg.approvermatrix.view.fragments.MassUploadMessagePopover", component);
				oView.addDependent(component._pMessagePopover);
			}
			sap.ui.core.Fragment.byId("fragErrMessPopOver", "massUploadErroPopOver").bindAggregation("items", {
				template: new sap.m.MessageItem({
					title: "{AppModel>field}",
					subtitle: "{AppModel>message}",
					type: "Error",
					enabled: false
				}),
				path: "AppModel>" + sPath + "/validationResults"
			});
			component._pMessagePopover.openBy(oSourceControl);
		},
		_fnPostMassSubmission: function (aPayload, component) {
			var serviceUrl = Config.dbOperations.createAuthMatrixUrl;
			var oHeaders = Utility._headerToken(component);
			Services._loadDataUsingJsonModel(serviceUrl, aPayload, "POST", oHeaders, function (oData) {
				var response = oData.getSource().getData();
				if (!response.error) {
					// MessageBox.success("Requests created successfully..!!");
					component.onCancelMassUploadAfterValidation();
					component.handleMatrixReq(response, true);
				} else {
					MessageBox.error("Failed to upload the data..!! \n Please try again..!!");
				}
				component.hideBusyIndicator();
			}.bind(component));

		}
	};
}, true);