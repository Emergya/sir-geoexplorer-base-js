/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = gxp
 *  class = LayerUploadPanel
 *  base_link = `Ext.FormPanel <http://extjs.com/deploy/dev/docs/?class=Ext.FormPanel>`_
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: KMLUploadPanel(config)
 *   
 *      A panel for uploading new KML data to PersistenceGeo.
 */
Viewer.plugins.KMLUploadPanel = Ext.extend(gxp.LayerUploadPanel, {
    
    /** i18n */
    titleLabel: "Title",
    titleEmptyText: "Layer title",
    makePersistentText: "Make persistent {0} KML layer?",
    
    /** api: config[validFileExtensions]
     *  ``Array``
     *  List of valid file extensions.  These will be used in validating the 
     *  file input value.  Default is ``[".kml"]``.
     */
    validFileExtensions: [".kml"],

    authorized: false,
    saveLayerToUser: false,
    
    /** api: config[url]
     *  ``String``
     *  URL for upload temp file to persistencegeo.
     */
     url: "persistenceGeo/uploadFile",
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        // Allow for a custom method to handle upload responses.
        config.errorReader = {
            read: config.handleUploadResponse || this.handleUploadResponse.createDelegate(this)
        };
        Viewer.plugins.KMLUploadPanel.superclass.constructor.call(this, config);
    },
    
    /** private: method[initComponent]
     */
    initComponent: function() {
        
        this.items = [{
            xtype: "textfield",
            name: "title",
            fieldLabel: this.titleLabel,
            emptyText: this.titleEmptyText,
            allowBlank: true
        }, {
            xtype: "fileuploadfield",
            id: "file",
            anchor: "90%",
            emptyText: this.fieldEmptyText,
            fieldLabel: this.fileLabel,
            name: "uploadfile",
            buttonText: "",
            buttonCfg: {
                iconCls: "gxp-icon-filebrowse"
            },
            listeners: {
                "fileselected": function(cmp, value) {
                    // remove the path from the filename - avoids C:/fakepath etc.
                    cmp.setValue(value.split(/[/\\]/).pop());
                }
            },
            validator: this.fileNameValidator.createDelegate(this)
        }];
        
        this.buttons = [{
            text: this.uploadText,
            handler: function() {
                var form = this.getForm();
                if (form.isValid()) {
                    form.submit({
                        url: this.getUploadUrl(),
                        waitMsg: this.waitMsgText,
                        waitMsgTarget: true,
                        reset: true,
                        success : function(form, action) {
                            var json = Ext.decode(action.response.responseText);
                            var idFile = json.data;
                            if(!!json && !!json.data){
                                this.idFile = json.data;
                                this.submitLayer();
                            }else{
                                //TODO: Show error
                            }
                        },
                        failure : function(form, action) {
                            var json = Ext.decode(action.response.responseText);
                            if(!!json && !!json.data){
                                this.idFile = json.data;
                                this.submitLayer();
                            }else{
                                //TODO: Show error
                            }
                        },
                        scope: this
                    });
                }
            },
            scope: this
        }];
        
        this.addEvents(

            /**
             * Event: uploadcomplete
             * Fires upon successful upload.
             *
             * Listener arguments:
             * panel - {<gxp.LayerUploadPanel} This form panel.
             * details - {Object} An object with an "import" property,
             *     representing a summary of the import result as provided by
             *     GeoServer's Importer API.
             */
            "uploadcomplete"
        );

        gxp.LayerUploadPanel.superclass.initComponent.call(this);

    },

    getParamsToSubmitKML: function(){
        var type = "KML";

        var fields = this.getForm().getFieldValues();
        
        // Get the layer params to save them
        var params = {
                name: fields.title,
                server_resource: "",
                type: type,
                idFile: this.idFile,
                properties:{
                    externalProjection: Viewer.GEO_PROJECTION,
                    visible: true
                    //TODO ,
                    // order: map.layers.length
                }
        };

        return params;
    },

    submitLayer: function(){

        // Get the layer params to save them
        var params = this.getParamsToSubmitKML();
        
        this.showSaveLayerWindow(params);

    },

    /**
     * private: method[showSaveLayerWindow]
     * Show a dialog to save a layerRecord
     */
    showSaveLayerWindow: function (params){
        var saveWindow = new Ext.Window({
            title: String.format(this.makePersistentText, params.name),
            closeAction: 'hide',
            width:500
        });
        var savePanel = new Viewer.widgets.SaveLayerPanel({
            authorized: this.target.isAuthorized(),
            target: this.target,
            paramsToSave: params,
            layerType: "KML",
            saveWindow: saveWindow,
            outputTarget: false
        });
        saveWindow.add(savePanel);
        if(this.target.isAuthorized()){
            saveWindow.show();
        }else{
            savePanel.submitForm();
        }
        if(!!this.win){
            this.win.hide();
        }else{
            this.hide();
        }
    },

    /** private: method[getUploadUrl]
     */
    getUploadUrl: function() {
        return this.target.defaultRestUrl + '/'  + this.url;
    }

});

/** api: xtype = vw_kmluploadpanel */
Ext.reg("vw_kmluploadpanel", Viewer.plugins.KMLUploadPanel);
