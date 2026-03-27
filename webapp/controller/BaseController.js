sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent", "../utils/dataformatter", "sap/ui/core/Fragment", "../utils/services", "../utils/utility"
], function (JSONModel, Controller, UIComponent, Formatter, Fragment, services, Utility) {
	"use strict";

	return Controller.extend("nus.edu.sg.approvermatrix.controller.BaseController", {

		getComponentModel: function (modelName) {
			var model = (modelName) ? this.getOwnerComponent().getModel(modelName) : this.getOwnerComponent().getModel();
			return model;
		},
		setComponentModel: function (modelName) {
			var model = (modelName) ? this.getOwnerComponent().setModel(new JSONModel(), modelName) : null;
			return this.getOwnerComponent().getModel(modelName);
		},
		handleRefresh: function () {
			this.getOwnerComponent().getInitialDataForUser();
		},
		getI18n: function (sTextField) {
			var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var i18nTextValue = oResourceBundle.getText(sTextField);
			return i18nTextValue ? i18nTextValue : sTextField;
		},
		/*
		 * Display Message in different Sections
		 */
		showMessagePopOver: function (messageElement) {
			messageElement = JSON.parse(JSON.stringify(messageElement));
			var messageModel = this.modelAssignment("MessagePopOver");
			var data = [];
			messageElement = (messageElement instanceof Array) ? messageElement : [messageElement];
			for (var i = 0; i < messageElement.length; i++) {
				data.push(messageElement[i]);
			}
			messageModel.setData(data);
			var showButton = this.getUIControl("showMsgeBtnId");
			showButton.firePress();
		},
		/*
		 * Close Message PopOver
		 */
		closeMessagePopOver: function () {
			//Initialize Message PopOver for the first time
			var messageModel = this.modelAssignment("MessagePopOver");
			if (!Formatter.validateDataInModels(messageModel)) {
				messageModel.setData(this.getOwnerComponent().getModel().getProperty("/messagedata"));
			}
			var data = messageModel.getData();
			data = (data.length > 0) ? [data[0]] : [];
			messageModel.setData(data);
		},
		/**
		 * Handle Navigation
		 */
		handleNav: function (target) {
			var navCon = this.getUIControl("claimNav");
			if (target) {
				navCon.to(this.getUIControl(target), "slide");
			}
		},
		/**
		 * Handle Routing
		 */
		handleRouting: function (target, navObj) {
			this.oRouter = this.getOwnerComponent().getRouter();
			if (!navObj) {
				navObj = {};
			}
			if (!navObj.layout) {
				navObj.layout = this.getOwnerComponent().getHelper().getNextUIState(1).layout;
			}
			this.oRouter.navTo(target, navObj);
		},
		wbsElementsLookUp: function (oEvent) {
			var token = this.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token
			};
			var url = "/eclaims/rest/fetchWBS?staffId=12564";
			var wbsElementTypeModel = new JSONModel();
			wbsElementTypeModel.loadData(url, null, false, "GET", null, null, oHeaders);
			this.AppModel.setProperty("/claimRequest/wbsElementsList", wbsElementTypeModel.getProperty("/"));
		},
		staffListLookUp: function (oEvent) {

			var token = this.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token
			};
			var selMonthYear = this.AppModel.getProperty("/claimRequest/month");
			var aSelMonthYear = selMonthYear.split("-");
			var year = aSelMonthYear[0];
			var month = parseInt(aSelMonthYear[1]) + 1;
			month = month.toString();

			var selClaimType = this.AppModel.getProperty("/claimRequest/claimType");
			var url = "/eclaims/rest/staffLookup?claimMonth=8&claimYear=2020&claimType=006";
			//https://eclaimsj2fq972k5h.ap1.hana.ondemand.com/eclaims/rest/staffLookup?claimMonth=&claimYear=&claimType=006
			var staffListModel = new JSONModel();
			staffListModel.loadData(url, null, false, "GET", null, null, oHeaders);

			this.AppModel.setProperty('/claimRequest/staffList', staffListModel.getProperty("/"));
		},

		generateFilter: function (sValueToFilter, aFilterValues, sOperator) {
			sOperator = sOperator || sap.ui.model.FilterOperator.EQ;
			var aFilterArray = aFilterValues.map(function (sFilterValue) {
				return new sap.ui.model.Filter(sValueToFilter, sOperator, sFilterValue);
			});
			return aFilterArray;
		},

		/**
		 * Set Values From Lookup
		 */
		setValuesFromLookup: function (bindingControl, selectedObj) {
			switch (bindingControl) {
			case "department":
				break;
			case "moduleCode":
				break;
			case "/staffName":
				break;
			case "/claimRequest/createClaimRequest/claimTypeDesc":
				this.AppModel.setProperty("/claimRequest/createClaimRequest/claimType", selectedObj.CLAIM_TYPE_C);
				this.AppModel.setProperty("/claimRequest/createClaimRequest/claimTypeDesc", selectedObj.CLAIM_TYPE_T);
				break;
			case "/claimRequest/createClaimRequest/claimTypeList/0/CLAIM_TYPE_C":
				this.AppModel.setProperty("/claimRequest/createClaimRequest/claimTypeList/0/CLAIM_TYPE_C", selectedObj.CLAIM_TYPE_C);
				//this.AppModel.setProperty("/claimRequest/createClaimRequest/claimTypeList/0/CLAIM_TYPE_T", selectedObj.CLAIM_TYPE_T);
				break;
			default:
				break;
			}
		},
		/**
		 * Model Assignment Function
		 */
		modelAssignment: function (modelName, objAssign) {
			var view = this.getView();
			var model = view.getModel(modelName);
			if (!model) {
				if (objAssign) {
					model = new JSONModel(objAssign);
				} else {
					model = new JSONModel();
				}
				view.setModel(model, modelName);
			}
			return model;
		},
		/**
		 * Get Employee Data
		 */
		getEmployeeData: function (employeeId, userList) {
			var employeeData = {};
			for (var i = 0; i < userList.length; i++) {
				if (employeeId === userList[i].userId) {
					employeeData = userList[i];
					break;
				}
			}
			return employeeData;
		},

		//Util Operation to Validate Date in the Appn
		checkDate: function (oEvent, srcMsgStrip, fragmentId) {
			srcMsgStrip = (srcMsgStrip) ? srcMsgStrip : (this.selectedIconTab === "Contract") ? "contractMsgStrip" : (this.selectedIconTab ===
				"Terminate") ? "terminateMsgStrip" : (this.selectedIconTab === "Ship Change") ? "shipMsgStrip" : "recruitMsgStrip";
			this.closeMessageStrip(srcMsgStrip);
			if (!(Formatter.validateEnteredDate(oEvent.getParameter("id"), oEvent.getParameter("valid")))) {
				this.showMessageStrip(srcMsgStrip, "Please select current or future date", "E", fragmentId);
			}
		},
		confirmOnAction: function (submissionCallBack) {
			var dialog = new sap.m.Dialog({
				title: "Confirmation",
				state: "Information",
				type: "Message",
				content: new sap.m.Text({
					text: "Do you want to Submit?"
				}),
				beginButton: new sap.m.Button({
					text: "Yes",
					press: function () {
						dialog.close();
						submissionCallBack();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		/*
		 * Show Message Strip
		 */
		showMessageStrip: function (stripId, message, mType, fragmentId) {
			var mStrip = this.getUIControl(stripId, fragmentId);
			mStrip.setText(message);
			mStrip.setType((mType === "E") ? "Error" : "None");
			mStrip.setVisible(true);
		},
		/**
		 * Show Message List in a Dialog 
		 */
		showMassUploadErrorDialog: function (errorMessageList) {
			if (this.errorDialog) {
				this.errorDialog.destroy(true);
			}
			this.errorDialog = sap.ui.xmlfragment(
				"com.stengglink.billingrequest.view.fragments.display.MassUploadErrorDialog", this);
			this.getView().addDependent(this.errorDialog);
			this.modelAssignment("ErrorMessageModel").setData(errorMessageList);
			this.errorDialog.open();
		},
		closeMassErrorDialog: function () {
			if (this.errorDialog) {
				this.errorDialog.destroy(true);
			}
		},
		/**
		 * Show Mass Upload Confirmation 
		 */
		showAcknowledgementDialog: function (ackData) {
			if (this.ackDialog) {
				this.ackDialog.destroy(true);
			}
			this.ackDialog = sap.ui.xmlfragment("com.stengglink.billingrequest.view.fragments.display.AcknowledgementDialog", this);
			this.getView().addDependent(this.ackDialog);
			this.ackDialog.setModel(new JSONModel(ackData));
			this.ackDialog.open();
		},
		/**
		 * Close Mass upload Confirmation Dialog
		 */
		closeAcknowledgementDialog: function () {
			if (this.ackDialog) {
				this.ackDialog.destroy(true);
			}
		},
		/**
		 * Close Message Strip
		 */
		closeMessageStrip: function (stripIds, fragmentId) {
			stripIds = (stripIds.indexOf(",") > -1) ? stripIds.split(",") : [stripIds];
			var control;
			var that = this;
			jQuery.sap.each(stripIds, function (s) {
				control = that.getUIControl(stripIds[s], fragmentId);
				if (control) {
					control.setVisible(false);
				}
			});
		},
		/*
		 * Set Busy Indicators
		 */
		loadBusyIndicator: function (content, isBusy) {
			var pageContent = this.getView().byId(content);
			pageContent = (pageContent) ? pageContent : sap.ui.getCore().byId(content);
			pageContent.setBusy(isBusy);
		},
		/**
		 * Fetch control
		 */
		getUIControl: function (id, fragmentId) {
			var view = this.getView();
			var control = (fragmentId) ? Fragment.byId(fragmentId, id) : (view.byId(id)) ? view.byId(id) : sap.ui.getCore().byId(id);
			return control;
		},
		formatAmount: function (val) {
			return Formatter.formatRequestAmount(val);
		},

		handleFilter: function () {
			var that = this;
			var sKey = this.getView().byId("itb1").getSelectedKey();
			var aFilters = this._mFilters[sKey];
			var oPayload = {
				"STAFF_NUSNET_ID": this.AppModel.getProperty("/loggedInUserInfo/userName"),
				"REQUEST_STATUS": []
			};
			for (var y = 0; y < aFilters.length; y++) {
				var obj = {};
				obj.REQUEST_STATUS = aFilters[y].oValue1;
				oPayload.REQUEST_STATUS.push(obj);
				//	oPayload.STAFF_NUSNET_ID = "CHELUK";
			}
			services.fetchFilterData(this, oPayload, function (oResponse) {
				that.AppModel.setProperty("/filterLookupData", oResponse);

			});

		},

		onPressSelectUluAndFdlu: function (oEvent) {

			var uluFdluList = [];
			this.AppModel.setProperty("/claimRequest/UluFdluList", "");
			var userRole = this.AppModel.getProperty("/userRole");
			if (userRole === "ESS") {
				var otherAssignments = this.AppModel.getProperty("/otherAssignments");
				var primaryAssignment = this.AppModel.getProperty("/primaryAssigment");
				uluFdluList.push({
					"ULU_C": primaryAssignment.ULU_C,
					"ULU_T": primaryAssignment.ULU_T,
					"FDLU_C": primaryAssignment.FDLU_C,
					"FDLU_T": primaryAssignment.FDLU_T
				});

				otherAssignments.forEach(function (item, index) {
					var uluFdluListItem = {};
					uluFdluListItem.ULU_C = item.ULU_C;
					uluFdluListItem.ULU_T = item.ULU_T;
					uluFdluListItem.FDLU_C = item.FDLU_C;
					uluFdluListItem.FDLU_T = item.FDLU_T;
					if (item.isDuplicateUluFdlu === 'N') {
						uluFdluList.push(uluFdluListItem);
					}
				});
				this.AppModel.setProperty("/claimRequest/UluFdluList", uluFdluList);
			} else if (userRole === "CA") {
				var token = this.AppModel.getProperty("/token");
				var oHeaders = {
					"Accept": "application/json",
					"Authorization": "Bearer" + " " + token,
					"Content-Type": "application/json"
				};
				var claimType = this.AppModel.getProperty("/claimRequest/createClaimRequest/claimTypeList/0/CLAIM_TYPE_C");
				var period = this.AppModel.getProperty("/claimRequest/createClaimRequest/actSelMonYearInNo");
				var caUluFdluLookUpModel = new JSONModel();
				var url = "/rest/eclaims/fetchUluFdlu?userGroup=NUS_CHRS_ECLAIMS_CA&claimType=" + claimType + "&period=" + period;

				caUluFdluLookUpModel.loadData(url, null, false, "GET", null, null, oHeaders);

				var uluFdluList = caUluFdluLookUpModel.getProperty("/ULU_FDLU");
				this.AppModel.setProperty("/claimRequest/UluFdluList", uluFdluList);
			}

			var oView = this.getView();
			if (!this._oDialogVerifer) {
				this._oDialogVerifer = Fragment.load({
					id: oView.getId(),
					name: "nus.edu.sg.claimrequest.view.fragments.detaillayout.UluFdluValueHelpDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}

			this._oDialogVerifer.then(function (oDialog) {
				oDialog.setRememberSelections(true);
				oDialog.open();
			}.bind(this));
		},

		handleConfirmUluFdlu: function (oEvent) {

			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sPath = aContexts[0].getPath();
				var objSelectedUluFdlu = this.AppModel.getProperty(sPath);

				var objUluFdlu = {
					"ULU": objSelectedUluFdlu.ULU_T,
					"FDLU": objSelectedUluFdlu.FDLU_T
				};
				this.AppModel.setProperty("/claimRequest/createClaimRequest/uluSelected", objSelectedUluFdlu.ULU_T);
				this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluSelected", objSelectedUluFdlu.FDLU_T);
				this.AppModel.setProperty("/claimRequest/createClaimRequest/uluSelectedCode", objSelectedUluFdlu.ULU_C);
				this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluSelectedCode", objSelectedUluFdlu.FDLU_C);
				var month;
				var year;
				if (objSelectedUluFdlu.ULU_C && objSelectedUluFdlu.FDLU_C) {
					this.getRateTypesAndRateAmount(month, year, objSelectedUluFdlu.ULU_C, objSelectedUluFdlu.FDLU_C);
				}
			}
		},

		getRateTypesAndRateAmount: function (month, year, ulu, fdlu) {

			//fetch rate Type and rate Amount 
			var token = this.AppModel.getProperty("/token");
			var nusNetID = this.AppModel.getProperty("/claimRequest/createClaimRequest/claimantNusNetId");
			if (!nusNetID) {
				var userRole = this.AppModel.getProperty("/userRole");
				if (userRole === "ESS") {
					nusNetID = this.AppModel.getProperty("/loggedInUserId");
				}
				if (userRole === "CA") {
					nusNetID = this.AppModel.getProperty("/claimRequest/createClaimRequest/staffList/0/NUSNET_ID");
				}
			}
			if (!month || !year) {
				var claimMonth = this.AppModel.getProperty("/claimRequest/createClaimRequest/actSelMonYearInNo");
			} else {
				claimMonth = month + '-' + year;
			}
			var saveObj;
			saveObj = {
				CLAIM_MONTH: claimMonth,
				NUSNET_ID: nusNetID,
				ULU: ulu,
				FDLU: fdlu
			};

			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token,
				"Content-Type": "application/json"
			};

			var url = "/rest/eclaims/rateTypes";
			var rateTypeModel = new JSONModel();

			rateTypeModel.loadData(url, JSON.stringify(saveObj), false, "POST", null, null, oHeaders);
			var selMonthRateTypeNamountList = rateTypeModel.getProperty("/eligibleRateTypes");
			if (selMonthRateTypeNamountList) {
				var itemsSet = [];
				for (var i = 0; i < selMonthRateTypeNamountList.length; i++) {
					var item = selMonthRateTypeNamountList[i];
					var itemSetItem = {};
					itemSetItem.RateTypeCode = item.RATE_CODE;
					var rateCodeDesc = item.RATE_DESC.toLowerCase().split(" ");
					for (var j = 0; j < rateCodeDesc.length; j++) {
						rateCodeDesc[j] = rateCodeDesc[j][0].toUpperCase() + rateCodeDesc[j].slice(1);
					}
					itemSetItem.RateTypeDesc = rateCodeDesc.join(" ");
					itemSetItem.MAX_LIMIT = item.MAX_LIMIT;
					itemSetItem.aAmountListitems = item.items;
					itemsSet.push(itemSetItem);
				}
				this.AppModel.setProperty("/claimRequest/createClaimRequest/RateTypeDetails", itemsSet);
				this.AppModel.setProperty("/claimRequest/selMonthRateTypeNamountList", itemsSet);
			}
		},

		showBusyIndicator: function (milliseconds) {
			var delay = milliseconds || 0;
			sap.ui.core.BusyIndicator.show(delay);
		},

		hideBusyIndicator: function () {
			sap.ui.core.BusyIndicator.hide();
		},
		settingUluFdluValues: function () {
			var userRole = this.AppModel.getProperty("/userRole");
			var primaryAssigment = this.AppModel.getProperty("/primaryAssigment");
			var otherAssignments = this.AppModel.getProperty("/otherAssignments");
			this.AppModel.setProperty("/claimRequest/createClaimRequest/uluPrimary", primaryAssigment.ULU_T);
			this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluPrimary", primaryAssigment.FDLU_T);
			this.AppModel.setProperty("/claimRequest/createClaimRequest/uluPrimaryCode", primaryAssigment.ULU_C);
			this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluPrimaryCode", primaryAssigment.FDLU_C);
			if (userRole === 'ESS') {
				if (!otherAssignments.length) { // changed by Pankaj on 5th Sep
					this.AppModel.setProperty("/claimRequest/createClaimRequest/uluSelected", primaryAssigment.ULU_T);
					this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluSelected", primaryAssigment.FDLU_T);
					this.AppModel.setProperty("/claimRequest/createClaimRequest/uluSelectedCode", primaryAssigment.ULU_C);
					this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluSelectedCode", primaryAssigment.FDLU_C);
				}
			} else if (userRole === 'CA') { //added to fix the issue of wrong ULU and FDLU prepopulated value showingvfor CA
				var claimAuthorizations = this.AppModel.getProperty("/claimAuthorizations");
				if (claimAuthorizations.length === 1) {
					this.AppModel.setProperty("/claimRequest/createClaimRequest/uluSelected", claimAuthorizations[0].ULU_T);
					this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluSelected", claimAuthorizations[0].FDLU_T);
					this.AppModel.setProperty("/claimRequest/createClaimRequest/uluSelectedCode", claimAuthorizations[0].ULU_C);
					this.AppModel.setProperty("/claimRequest/createClaimRequest/fdluSelectedCode", claimAuthorizations[0].FDLU_C);
				}
			}
		},
		_fnClearAppModel: function () {
			Utility._fnAppModelSetProperty(this, "/attachmentList", []);
			Utility._fnAppModelSetProperty(this, "/showSearchField", false);
			Utility._fnAppModelSetProperty(this, "/rejectionRemarks", "");
			Utility._fnAppModelSetProperty(this, "/requiredUiControl", {
				"ClaimTypeDialog": {
					"claimType": true,
					"selectMonth": true,
					"staffId": false,
					"ulu": true,
					"fdlu": true,
					"claimRequestType": false
				},
				"ClaimDetailView": {
					"startTime": false,
					"endTime": false,
					"hoursUnit": false,
					"rateType": false,
					"rateAmount": false,
					"isDiscrepancy": false,
					"amountDiscrepancy": false,
					"totalAmount": false,
					"wbs": false,
					"remarks": false
				}
			});
			Utility._fnAppModelSetProperty(this, "/isClaimLocked", false);
			Utility._fnAppModelSetProperty(this, "/isClaimLockedMessage", true);
			Utility._fnAppModelSetProperty(this, "/disclaimerConfirmChecked", false);
			Utility._fnAppModelSetProperty(this, "/claimAuthorizations", []);
			Utility._fnAppModelSetProperty(this, "/sClaimaintListUluFdlu", "");
			Utility._fnAppModelSetProperty(this, "/iconTabBarSelectedKey", "Draft");
			Utility._fnAppModelSetProperty(this, "/showSaveButton", false);
			Utility._fnAppModelSetProperty(this, "/showSubmitButton", false);
			Utility._fnAppModelSetProperty(this, "/showWithdrawButton", false);
			Utility._fnAppModelSetProperty(this, "/showRetractButton", false);
			Utility._fnAppModelSetProperty(this, "/showCheckButton", false);
			Utility._fnAppModelSetProperty(this, "/showRejectButton", false);
			Utility._fnAppModelSetProperty(this, "/showVerifyButton", false);
			Utility._fnAppModelSetProperty(this, "/showApproveButton", false);
			Utility._fnAppModelSetProperty(this, "/showAdditonalApprover2", false);
			Utility._fnAppModelSetProperty(this, "/showAdditionalApproverLink", true);
			Utility._fnAppModelSetProperty(this, "/showRemoveAdditionalApproverLink", false);
			Utility._fnAppModelSetProperty(this, "/exitFullScreen", true);
			Utility._fnAppModelSetProperty(this, "/closeColumn", true);
			Utility._fnAppModelSetProperty(this, "/processFlowRequestID", "");
			Utility._fnAppModelSetProperty(this, "/processNode", {
				"nodes": [],
				"lanes": []
			});
			Utility._fnAppModelSetProperty(this, "/errorMessage", []);
			Utility._fnAppModelSetProperty(this, "/errorMessages", {
				"valueState": {
					"ClaimTypeDialog": {
						//"claimTypeDialogStaffId" : false
						// "proceedButton" : false,
						// "massuploadButton" : false
					},
					"ClaimDetailView": {
						"wbs": false
							// "Date" : true,
							// "StartDate" : false,
							// "EndDate" : false,
							// "SelectDates" : false
					},
					"SelectPlanningDateFromCalendar": {
						"wbs": false
					}
				},
				"valueStateText": {
					"ClaimTypeDialog": {},
					"ClaimDetailView": {
						"wbs": false
					},
					"SelectPlanningDateFromCalendar": {
						"wbs": false
					}
				}
			});
			Utility._fnAppModelSetProperty(this, "/enable", {
				"ClaimTypeDialog": {

				},
				"ClaimDetailView": {
					"ROW_ACTIONS": true,
					"ROW_ADD": true,
					"ROW_DELETE": true,
					"CLAIM_START_DATE": true,
					"CLAIM_END_DATE": true,
					"CLAIM_DAY_TYPE": true,
					"START_TIME": true,
					"END_TIME": true,
					"HOURS_UNIT": true,
					"RATE_TYPE": true,
					"RATE_TYPE_AMOUNT": true,
					"IS_DISCREPENCY": true,
					"DISC_RATETYPE_AMOUNT": true,
					"WBS": true,
					"REMARKS": true,
					"VERIFIER_SRCH_HELP": false,
					"ADD_1_SRCH_HELP": false,
					"ADD_2_SRCH_HELP": false,
					"ATTACHMENT_UPLOAD": false
				}
			});
			Utility._fnAppModelSetProperty(this, "/visibility", {
				"ClaimTypeDialog": {
					"claimTypeDialogStaffId": false
				},
				"ClaimDetailView": {
					"Date": true,
					"StartDate": false,
					"EndDate": false,
					"StartTime": true,
					"EndTime": true,
					"SelectDates": false,
					"UluFdluSelection": false
				}
			});

		}
	});
}, true);