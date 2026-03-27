sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel",
	"./services",
	"./configuration",
	"./dataformatter",
	"sap/m/Dialog",
	"sap/m/Text"
], function (Filter, FilterOperator, FilterType, Fragment, Sorter, JSONModel, Services, Config, Formatter, Dialog, Text) {
	"use strict";
	return {

		_fnAppModelGetProperty: function (component, sPath) {
			return component.AppModel.getProperty(sPath) ? component.AppModel.getProperty(sPath) : "";
		},
		_fnAppModelSetProperty: function (component, sPath, sValue) {
			return component.AppModel.setProperty(sPath, sValue);
		},
		/**
		 * Parse Object
		 */
		_parseJsonData: function (data) {
			if (data) {
				data = JSON.parse(JSON.stringify(data));
			}
			return data;
		},
		_populateDesignationList: function (component) {
			var populateObj = {};
			var designationList = this._parseJsonData(component.getComponentModel("LocalModel").getProperty("/newDesignationList"));
			var userRole = component.AppModel.getProperty("/userRole");
			var userGrp = component.AppModel.getProperty("/userGrp");
			var userParameterRole = component.AppModel.getProperty("/userParameterRole");

			if (userRole && userParameterRole === component.getI18n("ApproverMatrix.User.AdminGrp")) {
				designationList.push(this._parseJsonData(component.getComponentModel("LocalModel").getProperty("/deptAdminElement")));
			} else {
				var isAuthMatrix = Boolean(component.AppModel.getProperty("/staffInfo/authMatrix"));
				populateObj.isAllFdluVisible = !isAuthMatrix;
			}
			populateObj.designationList = designationList;
			populateObj = this._parseJsonData(populateObj);
			return populateObj;

		},
		_getDataToShowInLookupforFdlu: function (approverMatrix, uluValue) {
			var tempMatrix = [];
			jQuery.sap.each(approverMatrix, function (i, authMatrixElement) {
				if ((authMatrixElement.ULU === uluValue) || (authMatrixElement.ULU_C === uluValue)) {
					tempMatrix.push(authMatrixElement);
				}
			});
			return tempMatrix;
		},
		_assignTokenAndUserInfo: function (oRetData, component) {
			component.AppModel.setProperty("/token", oRetData.token);
			component.AppModel.setProperty("/staffInfo", oRetData.staffInfo);

			var approverMatrix = [];
			var userRole, processCode, deptAdminProcessCode = "";

			if (oRetData && oRetData.staffInfo && oRetData.staffInfo.approverMatrix) {
				jQuery.sap.each(oRetData.staffInfo.approverMatrix, function (i, appElement) {

					if (appElement.STAFF_USER_GRP === component.getI18n("ApproverMatrix.User.AdminGrp")) {
						userRole = component.getI18n("ApproverMatrix.User.AdminGrp");
						processCode = appElement.PROCESS_CODE;
					}

					if (appElement.STAFF_USER_GRP === component.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
						userRole = (!userRole) ? component.getI18n("ApproverMatrix.User.DeptAdminGrp") : userRole;
						processCode = (!processCode) ? appElement.PROCESS_CODE : processCode;
						deptAdminProcessCode += (appElement.PROCESS_CODE) ? appElement.PROCESS_CODE + "," : "";
						approverMatrix.push(appElement);
					}

					// if (appElement.STAFF_USER_GRP === component.getI18n("ApproverMatrix.User.DepartmentAdmin")) {
					// 	userRole = (!userRole) ? component.getI18n("ApproverMatrix.User.DepartmentAdmin") : userRole;
					// 	processCode = (!processCode) ? appElement.PROCESS_CODE : processCode;
					// 	deptAdminProcessCode += (appElement.PROCESS_CODE) ? "," + appElement.PROCESS_CODE : "";
					// 	approverMatrix.push(appElement);
					// }

					if (appElement.STAFF_USER_GRP === component.getI18n("ApproverMatrix.User.AppAdminGrp")) {
						userRole = (!userRole) ? component.getI18n("ApproverMatrix.User.AppAdminGrp") : userRole;
						processCode = (!processCode) ? appElement.PROCESS_CODE : processCode;
						deptAdminProcessCode += (appElement.PROCESS_CODE) ? appElement.PROCESS_CODE + "," : "";
						approverMatrix.push(appElement);
					}

					//Handle View only Provision for CWS/NED Process and for OHRSS Group only
					if (String(appElement.PROCESS_CODE).startsWith(component.getI18n("ApproverMatrix.cwsned.processinitial")) && appElement.STAFF_USER_GRP ===
						component.getI18n("ApproverMatrix.User.Ohrss")) {
						userRole = (!userRole) ? component.getI18n("ApproverMatrix.User.Ohrss") : userRole;
						processCode = (!processCode) ? appElement.PROCESS_CODE : processCode;
						deptAdminProcessCode += (appElement.PROCESS_CODE) ? appElement.PROCESS_CODE + "," : "";
						approverMatrix.push(appElement);
					}

				});
			}
			component.AppModel.setProperty("/userRole", userRole);
			component.AppModel.setProperty("/userGrp", userRole);
			component.AppModel.setProperty("/processCode", processCode);

			// Remove duplicates deom deptAdmin Process Code
			deptAdminProcessCode = deptAdminProcessCode.replace(/,+$/, "");
			deptAdminProcessCode = [...new Set(deptAdminProcessCode.split(","))].join(",");
			component.AppModel.setProperty("/deptAdminProcessCode", deptAdminProcessCode);

			component.AppModel.setProperty("/staffInfo/approverMatrix", (component.AppModel.getProperty("/userRole") === component.getI18n(
				"ApproverMatrix.User.AdminGrp")) ? [] : approverMatrix);

			//Check for Department Admin and Retrieve the Authorization Details
			var userGrp = component.AppModel.getProperty("/userGrp");
			var staffNumber = (oRetData && oRetData.staffInfo && oRetData.staffInfo.primaryAssignment && oRetData.staffInfo.primaryAssignment.STF_NUMBER) ?
				oRetData.staffInfo.primaryAssignment.STF_NUMBER : "";
			if (staffNumber && userGrp && userGrp === component.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
				var authMatrixData = Services._getDepartmentAdminAuthorization(component);
				component.AppModel.setProperty("/staffInfo/authMatrix", authMatrixData);
				//Maintain the Department Admin Flag for Department Admin Approver Matrix Provisioning
				var isDeptAdmin = (authMatrixData instanceof Array && authMatrixData.length > 0);
				component.AppModel.setProperty("/isDeptAdmin", isDeptAdmin);
			}

			var oComponentData = component.getOwnerComponent().getComponentData();
			if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.role && oComponentData.startupParameters
				.role.length > 0) {
				component._startUpParameterRole = oComponentData.startupParameters.role[0];
			}
		},
		/**
		 * Amend Default Filter for Approver Matrix
		 */
		_fnApproverMatrixDefaultFilter: function (component) {
			// var aFilter = [];
			var andParamFilter = [];

			var staffUserGrpFilter = [];
			staffUserGrpFilter.push(new Filter("STAFF_USER_GRP", FilterOperator.NE, component.getI18n("ApproverMatrix.User.AdminGrp")));
			staffUserGrpFilter.push(new Filter("STAFF_USER_GRP", FilterOperator.NE, component.getI18n("ApproverMatrix.User.SuperAdminGrp")));
			staffUserGrpFilter.push(new Filter("STAFF_USER_GRP", FilterOperator.NE, component.getI18n("ApproverMatrix.User.ITAdminGrp")));

			andParamFilter.push(new Filter(staffUserGrpFilter, true));

			var userGrp = component.AppModel.getProperty("/userGrp");
			var staffInfo = component.AppModel.getProperty("/staffInfo");
			var isDeptAdmin = component.AppModel.getProperty("/isDeptAdmin");

			if (isDeptAdmin) {
				andParamFilter.push(new Filter("STAFF_USER_GRP", FilterOperator.NE, component.getI18n("ApproverMatrix.User.DeptAdminGrp")));
				var deptAdminProcessCode = component.AppModel.getProperty("/deptAdminProcessCode");
				if (deptAdminProcessCode) {
					var deptAdminpCodeArray = deptAdminProcessCode.split(",");
					var processCodeOrFilter = [];
					jQuery.sap.each(deptAdminpCodeArray, function (i, codeElement) {
						if (codeElement) {
							processCodeOrFilter.push(new Filter("CLAIM_TYPE", FilterOperator.EQ, codeElement));
						}
					});
					andParamFilter.push(new Filter(processCodeOrFilter, false));
				}
			} else {
				if (userGrp && userGrp === component.getI18n("ApproverMatrix.User.Ohrss")) {
					var assignedProcessCodes = component.AppModel.getProperty("/deptAdminProcessCode");
					if (assignedProcessCodes) {
						var pCodeArray = assignedProcessCodes.split(",");
						var pCodeFilter = [];
						jQuery.sap.each(pCodeArray, function (i, processVal) {
							if (processVal) {
								pCodeFilter.push(new Filter("CLAIM_TYPE", FilterOperator.EQ, processVal));
							}
						});
						andParamFilter.push(new Filter(pCodeFilter, false));
					}
				} else {
					var processCode = component.AppModel.getProperty("/processCode");
					andParamFilter.push(new Filter("CLAIM_TYPE", FilterOperator.Contains, processCode.substring(0, 2)));
				}
			}

			return andParamFilter;
		},
		/**
		 * Approver Matrix Filter
		 */
		_fnApproverMatrixFilter: function (component) {
			component.AppModel.setProperty("/showAssignNewButton", true);
			component.AppModel.setProperty("/showToolbarButtons", true);
			component.AppModel.setProperty("/viewAccessOnly", true);
			var staffInfo = component.AppModel.getProperty("/staffInfo");
			var andFilter = [],
				andParamFilter, orFilter = [];
			var dFilter = component.AppModel.getProperty("/defaultMatrixFilter");
			var aFilter = dFilter ? [].concat(dFilter) : [];
			var userGrp = component.AppModel.getProperty("/userGrp");
			var isDeptAdmin = component.AppModel.getProperty("/isDeptAdmin");

			if (userGrp && userGrp === component.getI18n("ApproverMatrix.User.AdminGrp")) {
				// If the Logged In User is an Admin
				// Will be enhanced in future for admin Group
			} else if (isDeptAdmin) {
				var departmentProperty = component.getI18n("ApproverMatrix.User.DeptAdminGrp");
				jQuery.sap.each(staffInfo.authMatrix, function (i, approverMatrixElement) {
					andParamFilter = [];
					andParamFilter.push(new Filter("ULU", FilterOperator.EQ, approverMatrixElement.ULU));
					if (approverMatrixElement.FDLU !== component.getI18n("FDLU_ALL")) {
						andParamFilter.push(new Filter("FDLU", FilterOperator.EQ, approverMatrixElement.FDLU));
					}
					andParamFilter.push(new Filter("STAFF_USER_GRP", FilterOperator.NE, departmentProperty));
					andFilter.push(new Filter(andParamFilter, true));
				});
				if (andFilter.length > 0) {
					aFilter.push(new Filter(andFilter, false));
				}
			} else if (userGrp && userGrp === component.getI18n("ApproverMatrix.User.Ohrss")) {
				// Logic for OHRSS Group to provision to allow to see the Approver Matrix access only
				var ohrssGrp = component.getI18n("ApproverMatrix.User.Ohrss");
				jQuery.sap.each(staffInfo.approverMatrix, function (i, approverMatrixElement) {
					andParamFilter = [];
					if (approverMatrixElement.ULU_C !== component.getI18n("ApproverMatrix.AllSelection")) {
						andParamFilter.push(new Filter("ULU", FilterOperator.EQ, approverMatrixElement.ULU_C));
					}
					// andParamFilter.push(new Filter("ULU", FilterOperator.EQ, approverMatrixElement.ULU));
					if (approverMatrixElement.FDLU_C !== component.getI18n("FDLU_ALL")) {
						andParamFilter.push(new Filter("FDLU", FilterOperator.EQ, approverMatrixElement.FDLU_C));
					}
					// andParamFilter.push(new Filter("STAFF_USER_GRP", FilterOperator.EQ, ohrssGrp));
					if (andParamFilter.length > 0) {
						andFilter.push(new Filter(andParamFilter, true));
					}
				});
				if (andFilter.length > 0) {
					aFilter.push(new Filter(andFilter, false));
				}
				component.AppModel.setProperty("/showAssignNewButton", false);
			} else { //Not Assigned to Anything
				component.AppModel.setProperty("/showAssignNewButton", false);
				component.AppModel.setProperty("/showToolbarButtons", false);
				component.AppModel.setProperty("/viewAccessOnly", false);
			}

			//Process Code Filter
			// var sourceProcessCode = component.AppModel.getProperty("/processCode");
			// if (sourceProcessCode && sourceProcessCode.trim().length > 0) {
			// 	var processCodeFilter = new Filter("CLAIM_TYPE", sap.ui.model.FilterOperator.Contains, isDeptAdmin ? sourceProcessCode :
			// 		sourceProcessCode.substring(0, 2));
			// 	aFilter.push(processCodeFilter);
			// }

			var searchUserType = component.AppModel.getProperty("/searchUserType");
			if (searchUserType && searchUserType !== component.getI18n("ApproverMatrix.AllSelection")) {
				var userTypeFilter = new Filter("STAFF_STATUS", sap.ui.model.FilterOperator.EQ, searchUserType);
				aFilter.push(userTypeFilter);
			}

			return aFilter;
		},
		_fnProcessCodeFilter: function (component) {
			var processCode = component.AppModel.getProperty("/processCode");
			var userGrp = component.AppModel.getProperty("/userGrp");

			if (processCode && processCode.trim().length > 0) {
				var filtersGrp = new Filter({
					filters: [new Filter("PROCESS_CODE", FilterOperator.NE, processCode),
						new Filter("PROCESS_CODE", FilterOperator.Contains, processCode.substring(0, 2))
					],
					and: true
				});

				var deptAdminProcessCode = component.AppModel.getProperty("/deptAdminProcessCode");
				if (deptAdminProcessCode && userGrp && userGrp === component.getI18n("ApproverMatrix.User.DeptAdminGrp")) {
					var deptAdminpCodeArray = deptAdminProcessCode.split(",");
					var elementFilter = [];
					jQuery.sap.each(deptAdminpCodeArray, function (i, codeElement) {
						if (codeElement) {
							elementFilter.push(new Filter("PROCESS_CODE", FilterOperator.EQ, codeElement));
						}
					});
					return elementFilter;
				}

				var aOverAllFilter = [];
				aOverAllFilter.push(filtersGrp);
				return aOverAllFilter;
			}
		},
		_fnDesignationFilter: function (component, selectedProcess) {
			var processCode = (selectedProcess) ? selectedProcess : component.AppModel.getProperty("/processCode");

			var aOverAllFilter = [];
			if (processCode && processCode.trim().length > 0) {
				var filtersGrp = new Filter({
					filters: [new Filter("CONFIG_KEY", FilterOperator.EQ, component.AppModel.getProperty("/userGrp")),
						new Filter("PROCESS_CODE", (selectedProcess) ? FilterOperator.EQ : FilterOperator.StartsWith, (selectedProcess) ?
							selectedProcess : processCode.substring(0, 2))
					],
					and: true
				});

				aOverAllFilter.push(filtersGrp);
			}
			return aOverAllFilter;
		},
		_headerToken: function (component) {
			var token = component.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer " + token,
				"AccessPoint": "A",
				"Content-Type": "application/json"
			};
			return oHeaders;
		},
		/**
		 * Search Based on Params
		 */
		_searchBasedOnParams: function (sValue, asOfDate, oGroup, userType, component) {
			sValue = (sValue && sValue.trim().length > 0) ? sValue : "";
			var filterNusNetId = new Filter("STAFF_NUSNET_ID", sap.ui.model.FilterOperator.Contains, sValue);
			var filterFdluCode = new Filter("FDLU", sap.ui.model.FilterOperator.Contains, sValue);
			var filterFdluText = new Filter("FDLU_T", sap.ui.model.FilterOperator.Contains, sValue);
			var filterFullName = new Filter("FULL_NM", sap.ui.model.FilterOperator.Contains, sValue);
			var filterStfNumber = new Filter("STAFF_ID", sap.ui.model.FilterOperator.Contains, sValue);
			var filterUluCode = new Filter("ULU", sap.ui.model.FilterOperator.Contains, sValue);
			var filterUluText = new Filter("ULU_T", sap.ui.model.FilterOperator.Contains, sValue);
			var filterClaimType = new Filter("CLAIM_TYPE", sap.ui.model.FilterOperator.Contains, sValue);
			var filterStaffUserGrp = new Filter("STAFF_USER_GRP", sap.ui.model.FilterOperator.Contains, sValue);
			var filterStaffUserGrpAlias = new Filter("STAFF_USER_ALIAS", sap.ui.model.FilterOperator.Contains, sValue);

			var filterUpdatedByNid = new sap.ui.model.Filter("UPDATED_BY_NID", sap.ui.model.FilterOperator.Contains, sValue);

			var filtersGrp = new Filter({
				filters: [filterNusNetId, filterFdluCode, filterFdluText, filterFullName, filterStfNumber, filterUluCode,
					filterUluText, filterClaimType, filterUpdatedByNid, filterStaffUserGrp, filterStaffUserGrpAlias
				],
				and: false
			});

			var aOverAllFilter = [];

			// Amend Default and Role Specific Filters in Approver Matrix Access
			var appMatrixFilter = this._fnApproverMatrixFilter(component);
			var isDeptAdmin = component.AppModel.getProperty("/isDeptAdmin");
			jQuery.sap.each(appMatrixFilter, function (i, fElement) {
				aOverAllFilter.push(fElement);
			});

			aOverAllFilter.push(filtersGrp);

			if (userType && userType !== component.getI18n("ApproverMatrix.AllSelection")) {
				var filterUserType = new Filter("STAFF_STATUS", sap.ui.model.FilterOperator.EQ, (userType) ? userType : 'A');
				aOverAllFilter.push(filterUserType);
			}
			//Date Filter
			if (asOfDate) {
				var dateFilter = [];
				var validFromFilter = new Filter("APM_VALID_FROM", sap.ui.model.FilterOperator.LE, asOfDate);
				var validToFilter = new Filter("APM_VALID_TO", sap.ui.model.FilterOperator.GE, asOfDate);
				dateFilter.push(validFromFilter);
				dateFilter.push(validToFilter);
				//final filter query
				var asOfDateFilter = new Filter({
					filters: dateFilter,
					and: true
				});
				aOverAllFilter.push(asOfDateFilter);
			}

			if (oGroup) {
				var filterStaffUserGroup = new Filter("STAFF_USER_GRP", sap.ui.model.FilterOperator.EQ, oGroup);
				aOverAllFilter.push(filterStaffUserGroup);
			}

			var overAllFilter = new Filter({
				filters: aOverAllFilter,
				and: true
			});

			return [overAllFilter];
		},

		_generateFilter: function (sValueToFilter, aFilterValues, sOperator) {
			sOperator = sOperator || sap.ui.model.FilterOperator.EQ;
			var aFilterArray = aFilterValues.map(function (sFilterValue) {
				return new sap.ui.model.Filter(sValueToFilter, sOperator, sFilterValue);
			});
			return aFilterArray;
		},
		_bindItems: function (component, controlId, sPath, oSorter, oTemplate, aFilter) {
			var oControl = component.getUIControl(controlId);
			oControl.bindItems({
				path: sPath,
				sorter: oSorter,
				template: oTemplate,
				filters: aFilter //filters //oFilter//filters
			});
		},
		_handleCloseOpenedFragment: function (component) {
			// component._oDialog.close();
			component._oDialog.destroy();
			component._oDialog = null;
			component._oDialog = undefined;
		},
		_handleOpenPopOver: function (oEvent, component, _pQuickView, fragmentName, fragId) {
			var oButton = oEvent.getSource(),
				oView = component.getView();

			if (!component._pQuickView) {
				component._pQuickView = Fragment.load({
					id: fragId,
					name: fragmentName,
					controller: component
				}).then(function (oQuickView) {
					oView.addDependent(oQuickView);
					return oQuickView;
				});
			}
			component._pQuickView.then(function (oQuickView) {
				oQuickView.openBy(oButton);
			});
		},
		_fnHandleStaffId: function (component) {
			var userRole = component.AppModel.getProperty("/userRole");
			if (userRole === "ESS") {
				return component.AppModel.getProperty("/loggedInUserId");
			}
			if (userRole === "CA") {
				// return component.AppModel.getProperty("/claimRequest/createClaimRequest/staffList/0/NUSNET_ID");
				return component.AppModel.getProperty("/loggedInUserId");
			} else {
				return component.AppModel.getProperty("/loggedInUserId");
			}

		},
		handlingSession: function (component) {
			this.setIdleTimeout(15000, function () {}, function () {});
		},
		_fnSortingEclaimItemData: function (claimItems) {
			claimItems.sort(
				(objA, objB) => Number(new Date(objA.CLAIM_START_DATE)) - Number(new Date(objB.CLAIM_START_DATE)),
			);
			return claimItems;
		},

		setIdleTimeout: function (millis, onIdle, onUnidle) {
			var timeout = 0;
			startTimer();

			function startTimer() {
				timeout = setTimeout(onExpires, millis);
				document.addEventListener("mousemove", onActivity);
				document.addEventListener("keydown", onActivity);
				document.addEventListener("touchstart", onActivity);
			}

			function onExpires() {
				timeout = 0;
				onIdle();
			}

			function onActivity() {
				if (timeout) clearTimeout(timeout);
				else onUnidle();
				//since the mouse is moving, we turn off our event hooks for 1 second
				document.removeEventListener("mousemove", onActivity);
				document.removeEventListener("keydown", onActivity);
				document.removeEventListener("touchstart", onActivity);
				setTimeout(startTimer, 1000);
			}
		},
		_createColumnConfig: function (component, EdmType) {
			var aCols = [];

			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column2"),
				property: 'ULU',
				type: EdmType.String,
				template: '{0}, {1}'
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column1"),
				property: 'PROCESS_TITLE',
				type: EdmType.String,
				template: '{0}, {1}'
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.Column2"),
				type: EdmType.String,
				property: ['ULU_T', 'ULU', 'FDLU_T', 'FDLU'],
				template: '{0}({1})/{2}({3})'
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.Column3"),
				type: EdmType.String,
				property: ['FULL_NM', 'STAFF_ID', 'STAFF_NUSNET_ID'],
				template: '{0} {1} ({2})'
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.Column4"),
				property: 'STAFF_USER_ALIAS',
				type: EdmType.String
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.Column5"),
				property: 'VALID_FROM',
				type: EdmType.Date
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.Column6"),
				property: 'VALID_TO',
				type: EdmType.Date
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.CColumn7"),
				property: 'UPDATED_ON',
				type: EdmType.Date
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.Table.CColumn8"),
				property: 'UPDATED_BY_NID',
				type: EdmType.String
			});

			// aCols.push({
			// 	label: component.getI18n("ApproverMatrix.Table.Column7"),
			// 	property: ['UPDATED_ON_DISPLAY', 'UPDATED_BY_NID'],
			// 	type: EdmType.String,
			// 	template: '{0}/{1}'
			// });

			return aCols;
		},
		_createColumnConfigForMassResponse: function (component, EdmType, isMassUploadResponse) {
			var aCols = [];
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column12"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop11"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column2"),
				type: EdmType.String,
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop1"),
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column9"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop8"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column3"),
				type: EdmType.String,
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop2"),
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column10"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop9"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column4"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop3"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column11"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop10"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column5"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop4"),
				type: EdmType.String
			});
			// Begin of change - CCEV3364
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column14"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop13"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column15"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop14"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column16"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop15"),
				type: EdmType.String
			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column17"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop16"),
				type: EdmType.String

			});
			// End of change - CCEV3364
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column6"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop5"),
				type: EdmType.String

			});
			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column7"),
				property: (isMassUploadResponse) ? component.getI18n("ApproverMatrix.MatrixTable.Prop6_1") : component.getI18n(
					"ApproverMatrix.MatrixTable.Prop6"),
				type: (isMassUploadResponse) ? EdmType.String : sap.ui.export.EdmType.Date,
				format: 'dd.MM.yyyy'
			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column8"),
				property: (isMassUploadResponse) ? component.getI18n("ApproverMatrix.MatrixTable.Prop7_1") : component.getI18n(
					"ApproverMatrix.MatrixTable.Prop7"),
				type: (isMassUploadResponse) ? EdmType.String : sap.ui.export.EdmType.Date,
				formatOptions: {
					pattern: 'dd.MM.yyyy'
				}
			});
			aCols.push({
				label: "Changed On",
				property: "UPDATED_ON",
				type: (isMassUploadResponse) ? EdmType.String : sap.ui.export.EdmType.Date,
				formatOptions: {
					pattern: 'dd.MM.yyyy'
				}
			});
			aCols.push({
				label: "Changed By",
				property: "UPDATED_BY_NID",
				type: EdmType.String

			});

			aCols.push({
				label: component.getI18n("ApproverMatrix.MatrixTable.Column13"),
				property: component.getI18n("ApproverMatrix.MatrixTable.Prop12"),
				type: EdmType.String
			});
			// aCols.push({
			// 	label: component.getI18n("ApproverMatrix.MatrixTable.Column12"),
			// 	property: 'errorMessage',
			// 	width: '10'
			// });
			return aCols;
		}
	};
}, true);