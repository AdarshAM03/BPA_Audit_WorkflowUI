sap.ui.define(
	[
		"sap/ui/core/mvc/Controller"
	],
	function (BaseController) {
		"use strict";

		return BaseController.extend("bpaaudit.workflowuimodule.controller.App", {
			onInit() {
				const oComponentData = this.getOwnerComponent().getComponentData();
				console.log("new code")
                if (oComponentData && oComponentData.startupParameters) {
					console.log("inside if of new code")
                    const startupParams = oComponentData.startupParameters;
                    const taskModel = startupParams.taskModel;
                    const taskId = taskModel.getData().InstanceID;

                    // 2. Fetch the Context using Workflow REST API
                    this._fetchWorkflowContext(taskId);
                }

				var sUrl = "https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/workflow/rest/v1/workflow-instances" + taskId + "/context";

				$.ajax({
					url: sUrl,
					method: "GET",
					success: function (oContext) {

						var oModel = new sap.ui.model.json.JSONModel(oContext);
						this.getView().setModel(oModel, "taskContext");

						console.log("Task Context:", oContext);

					}.bind(this)
				});

				//////////////////////////////////
				
				this._fetchChangeLogs();
				console.log("init function")
				const nameID = "_IDGenInput1"
				const email = "_IDGenInput2"
				const phone = "_IDGenInput3"
			},

			_fetchChangeLogs: function () {
				var sUrl = "https://8d0b19adtrial-dev-newloanfeature-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/simple/ChangeLogs";
				var that = this;
				console.log("Starting AJAX call...");

				$.ajax({
					url: sUrl,
					method: "GET",
					dataType: "json",
					headers: {
						"Accept": "application/json"
					},

					success: function (oData) {
						setTimeout(function () {

							if (!oData || !oData.value) return;

							var oneMinuteAgo = Date.now() - 60000;

							var aFilteredData = oData.value.filter(function (item) {
								return new Date(item.createdAt).getTime() > oneMinuteAgo;
							});

							console.table(aFilteredData);

							aFilteredData.forEach(function (item) {

								if (item.field === "name") {
									that.byId("_IDGenInput1").addStyleClass("highlightField");
								}

								if (item.field === "email") {
									that.byId("_IDGenInput2").addStyleClass("highlightField");
								}

								if (item.field === "phone") {
									that.byId("_IDGenInput3").addStyleClass("highlightField");
								}

							});

						}, 500);
					},

					error: function (oError) {
						console.error("AJAX Fetch Failed:", oError);
					}
				});
			},
			 _fetchWorkflowContext: function (taskId) {
                const oView = this.getView();
                
                // The URL prefix (e.g., /bpmworkflowruntime) depends on your xs-app.json configuration
                const sUrl = "/api/workflow/rest/v1/task-instances/" + taskId + "/context";

                $.ajax({
                    url: sUrl,
                    method: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success: function (data) {
                        // 3. Bind the retrieved context to a local JSON model
                        const oContextModel = new JSONModel(data);
                        oView.setModel(oContextModel, "contextModel");
                        console.log("Workflow Context Retrieved:", data);
                    },
                    error: function (error) {
                        console.error("Error fetching workflow context:", error);
                    }
                });
            }
        });
	}
);
