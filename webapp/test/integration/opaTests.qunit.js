/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"nus/edu/sg/approvermatrix/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});