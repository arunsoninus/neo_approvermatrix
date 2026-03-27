sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"./configuration", "./dataformatter"
], function (JSONModel, Device, Config, Formatter) {
	"use strict";

	return {
		fetchLoggedUserToken: function (sThis, callBackFx) {
			var that = this;
			var userModel = new JSONModel();
			userModel.loadData("/services/userapi/currentUser", null, false);
			sap.ui.getCore().setModel(userModel, "userapi");
			userModel.dataLoaded().then(function () {
				var sUserName = sap.ui.getCore().getModel("userapi").getData().name;
				sUserName = /*'uid53713';'arunsoni','GMSHOS',*/  'PHYARR';
				that._getUserDetails(sThis, sUserName, callBackFx);
			}.bind(sThis));
		},
		_getUserDetails: function (sThis, sUserName, callBackFx) {
			var tokenDetails = this.getLoggedInUserToken(sUserName, callBackFx);
		},
		getLoggedInUserToken: function (sUserName, callBackFx) {
			var oHeaders = {
				"Content-Type": "application/json"
			};
			var Payload = {
				"userName": sUserName
			};

			var authModel = new JSONModel();
			authModel.loadData("/tokenauthorize", JSON.stringify(Payload), null, "POST", null, null, oHeaders);
			authModel.attachRequestCompleted(function (oResponse) {
				if (oResponse.getParameters().success) {
					var tokenDetails = oResponse.getSource().getData();
					var userDetails = this.getUserInfoDetails(tokenDetails.token);
					Object.assign(userDetails, tokenDetails);
					callBackFx(userDetails);
				} else {
					if (oResponse.getParameters()['errorobject'].statusCode === 503) {
						this.AppModel.setProperty("/ErrorPageDescription", oResponse.getParameters()['errorobject'].responseText);
						this.AppModel.setProperty("/ErrorPageTitle", "Service Maintenance");
						this.AppModel.setProperty("/ErrorPageText", "Please reach out to the admin team if not started working in next 10 minutes.");
						this.oRouter.navTo("NotFound", true);
						return;
					}
				}
			}, this);
		},
		getUserInfoDetails: function (userToken) {
			var userInfoModel = new JSONModel();
			var oHeaders = Formatter._amendHeaderToken(null, userToken);
			userInfoModel.loadData(Config.dbOperations.userDetails, null, false, "GET", false, false, oHeaders);
			return userInfoModel.getData();
		},
		_getDepartmentAdminAuthorization: function (component) {
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + component.AppModel.getProperty("/token")
			};
			var sUrl = Config.dbOperations.deptAdminAuthUrl;
			var deptAuthModel = new JSONModel();
			deptAuthModel.loadData(sUrl, null, false, "GET", false, false, oHeaders);
			return deptAuthModel.getData();
		},

		fetchLoggeInUserImage: function (sThis, callBackFx) {
			var oPhotoModel = new JSONModel();
			var sUrl = Config.dbOperations.fetchPhotoUser;
			var staffInfo = sThis.AppModel.getProperty("/staffInfo");
			var staffNumber = (staffInfo && staffInfo.primaryAssignment && staffInfo.primaryAssignment.STF_NUMBER) ?
				staffInfo.primaryAssignment.STF_NUMBER : "";
			sUrl = sUrl + "?userId=" + staffNumber;
			// sUrl = sUrl + "?userId=CHELXIN";
			// sUrl = sUrl + "?userId=10000027";
			var token = sThis.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token
			};
			oPhotoModel.loadData(sUrl, null, null, "GET", null, null, oHeaders);
			oPhotoModel.attachRequestCompleted(function (oResponse) {
				if (oResponse.getSource().getData().d.results instanceof Array) {
					callBackFx(oResponse.getSource().getData().d.results[0]);
				} else {
					callBackFx({});
				}
			}.bind(sThis));

		},

		persistAssignmentData: function (component, oHeaders, isDelete, oPayload, callBackFx) {
			var sUrl = (isDelete) ? Config.dbOperations.deleteAuthMatrixUrl : Config.dbOperations.createAuthMatrixUrl;
			var persistModel = new JSONModel();
			var aMatrixData = [];
			aMatrixData.push(oPayload);
			persistModel.loadData(sUrl, JSON.stringify(aMatrixData), null, "POST", null, null, oHeaders);
			persistModel.attachRequestCompleted(function (oResponse) {
				callBackFx(oResponse.getSource().getData());
			}.bind(component));
		},

		fetchFilterData: function (sThis, oPayload, callBackFx) {
			var sUrl = Config.dbOperations.fetchFilterLookup;
			var token = sThis.AppModel.getProperty("/token");
			var oHeaders = {
				"Content-Type": "application/json",
				"Authorization": "Bearer" + " " + token
			};

			var filterModel = new JSONModel();
			filterModel.loadData(sUrl, JSON.stringify(oPayload), null, "POST", null, null, oHeaders);
			filterModel.attachRequestCompleted(function (oResponse) {

				if (oResponse.getSource().getData() instanceof Object) {
					callBackFx(oResponse.getSource().getData());
				} else {
					callBackFx({});
				}
			}.bind(sThis));
		},
		fetchUserImageAsync: function (sThis, staffId) {
			var oPhotoModel = new JSONModel();
			var sUrl = Config.dbOperations.fetchPhotoUser;
			sUrl = sUrl + "?userId=" + staffId;
			var token = sThis.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token
			};
			oPhotoModel.loadData(sUrl, null, false, "GET", null, null, oHeaders);
			return oPhotoModel.getData().d.results;
		},
		fetchTaskProcessDetails: function (sThis, objData, callBackFx) {
			var oTaskProcessModel = new JSONModel();
			var sUrl = Config.dbOperations.taskProcessHistory;
			sUrl = sUrl + objData.DRAFT_ID;
			var token = sThis.AppModel.getProperty("/token");
			var oHeaders = {
				"Accept": "application/json",
				"Authorization": "Bearer" + " " + token
			};
			oTaskProcessModel.loadData(sUrl, null, false, "GET", null, null, oHeaders);
			callBackFx(oTaskProcessModel.getData());
		},
		getEclaimsRequestViewCount: function (serviceUrl, oDataModel, component, aFilter, callBackFx) {
			oDataModel.read(serviceUrl, {
				filters: aFilter,
				success: function (oData) {
					if (oData) {
						callBackFx(oData);

					}
				}.bind(component),
				error: function (oError) {}
			});
		},
		getStatusConfig: function (serviceUrl, oDataModel, component, callBackFx) {
			oDataModel.read(serviceUrl, {
				success: function (oData) {
					if (oData) {
						return callBackFx(oData);
					}
				}.bind(component),
				error: function (oError) {}
			});
		},
		_readDataUsingOdataModel: function (serviceUrl, oDataModel, component, aFilter, callBackFx) {
			oDataModel.read(serviceUrl, {
				filters: aFilter,
				success: function (oData) {
					if (oData) {
						callBackFx(oData);

					}
				}.bind(component),
				error: function (oError) {
					callBackFx(oError);
				}
			});
		},
		_loadDataUsingJsonModel: function (serviceUrl, oPayload, httpMethod, headers, callBackFx) {
			var oModel = new JSONModel();
			var sPayload = null;
			if (oPayload) {
				if (httpMethod === "GET") {
					sPayload = oPayload;
				} else {
					sPayload = JSON.stringify(oPayload);
				}
			}
			oModel.loadData(serviceUrl, sPayload, null, httpMethod, null, null, headers);
			oModel.attachRequestCompleted(function (oResponse) {
				callBackFx(oResponse);
			});
		}
	};
});