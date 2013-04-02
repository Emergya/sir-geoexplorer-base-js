/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 *
 */

/** api: (define)
 *  module = Viewer.widgets
 *  class = LayerPanel
 *  base_link = `Ext.TabPanel <http://extjs.com/deploy/dev/docs/?class=Ext.TabPanel>`_
 */
Ext.namespace("Viewer.widgets");

/** api: constructor
 *  .. class:: LayerPanel(config)
 *   
 *      Create a dialog for setting WMS layer properties like title, abstract,
 *      opacity, transparency and image format.
 */
Viewer.widgets.SaveLayerPanel = Ext.extend(Ext.Container, {

    ptype: "vw_savelayerpanel",
    
    /** api: config[layerRecord]
     *  ``GeoExt.data.LayerRecord``
     *  Show properties for this layer record.
     */
    layerRecord: null,

    /** api: config[authorized]
     *  ``Boolean``
     *  A boolean indicates if is authorized to save layer.  Defaults to ``false``.
     */
    authorized: false,
    
    /** api: config[border]
     *  ``Boolean``
     *  Display a border around the panel.  Defaults to ``false``.
     */
    border: false,
    style: "padding: 10px",
    editable: false,
    saveLayerToUser: false,

    /** i18n */
    title: "Save",
    titleWindowLocationLayer: "Introduce the layer name and the parent folder",
    labelLayerName : "Layer name",
    labelLayerParentFolderName : "Select folder",
    selectNameText: "Introduce a name to the layer",
    selectComboBoxText : "Select the folder where save the layer",
    buttonFormLayer : "Save",
    nameFolderUser: "User Folder",
    selectFileText : "Select a {0} file to load",
    uploadingText : 'Uploading...',
    emptyText : 'Select a {0}',
    layerLoadedTitleText : 'Success',
    layerLoadedText : 'Layer {0} has been loaded',
    inProjectionText : "File projection",
    loadText : "Load",
    saveLayerTitleText: "Added layer", 
    saveLayerText: "Layer '{0}' has been added permanently to viewer.",
    saveLayerErrorTitleText: "Error ocurred!!",
    saveLayerErrorText: "An error ocurred saving '{0}' layer",
    cancelText: "Cancel",

    /** i18n WFS **/
    labelLayerMaxFeatures: "Max Features",
    selectMaxFeature: "Introduce the number of the maxim features to show",

    markIsSaved: false,

    layerType: null,

    layerName: null,

    paramsToSave: null,

    KNOWN_TYPES: {
        WMS: "WMS",
        WFS: "WFS",
        KML: "KML"
    },

    GET_FORM_ITEMS_FUNCTIONS:{
    },

    GET_PARAMS_FUNCTIONS:{
    },

    constructor: function(config) {

        Ext.apply(this,config);

        this.GET_FORM_ITEMS_FUNCTIONS ={
            "WMS": this.getPersonalizedItemsWMS,
            "WFS": this.getPersonalizedItemsWFS,
            "KML": this.getEmptyPersonalizedItems,
            "target": this
        };

        this.GET_PARAMS_FUNCTIONS ={
            "WMS": this.getParamsToSubmitWMS,
            "WFS": this.getParamsToSubmitWFS, 
            "KML": this.getDefaultParamsToSubmit, 
            "target": this
        };

        if(!this.layerType){
            var layer = this.layerRecord.getLayer();

            if(!!layer){
                if(layer instanceof OpenLayers.Layer.WMS){
                    // KNOWN_TYPES.WMS
                    this.layerType = this.KNOWN_TYPES.WMS;
                }else if(layer instanceof OpenLayers.Layer.Vector){
                    if(!!layer.protocol 
                        && !!layer.protocol.CLASS_NAME
                        && !!layer.protocol.CLASS_NAME.search){
                        if(layer.protocol.CLASS_NAME.search("OpenLayers.Protocol.WFS") == 0){
                            // KNOWN_TYPES.WFS
                            this.layerType = this.KNOWN_TYPES.WFS;
                        }
                    }
                }
            }
        }

        var formLocationLayer = new Ext.FormPanel({
            // labelWidth : 100,
            // width : 500,
            frame : true,
            height: 115,
            bodyStyle : 'padding: 10px 10px 0 10px;',
            defaultType : 'textfield',
            defaults : {
                anchor : '95%',
                allowBlank : false,
                msgTarget : 'side'
            },
            items : this.getFormItems(),
            buttons : [ {
                // text : this.buttonFormLayer,
                // handler : function() {
                //     // Get the input values
                //     this_.nameLayer = this_.form.get("inputName").getValue();
                //     // Save the layer
                //     this_.submitForm();
                text : this.cancelText,
                handler : this.hide,
                scope: this
            }, {
                // text : this.buttonFormLayer,
                // handler : function() {
                //     // Get the input values
                //     this_.nameLayer = this_.form.get("inputName").getValue();
                //     // Save the layer
                //     this_.submitForm();
                text : this.buttonFormLayer,
                handler : this.submitForm,
                scope: this
            } ]
        });

        if (!!this.authorized 
            // KML can be saved without auth
            || this.layerType == this.KNOWN_TYPES.KML ) {
            Viewer.widgets.SaveLayerPanel.superclass.constructor.call(this, Ext.apply({
                items: formLocationLayer
            }, config));
        } else {
            Viewer.widgets.SaveLayerPanel.superclass.constructor.call(this, config);
        }
    },

    hide: function(){
        // force save on KML as ANONYMOUS
        if(this.layerType 
                == this.KNOWN_TYPES.KML
                && !this.markIsSaved){
            this.authorized = false;
            // savemode to ANONYMOUS
            this.target.persistenceGeoContext.saveModeActive = this.target.persistenceGeoContext.SAVE_MODES.ANONYMOUS;
            this.submitForm();
        }

        if(!!this.saveWindow
            && !!this.saveWindow.hide){
            this.saveWindow.hide();
        }

        Viewer.widgets.SaveLayerPanel.superclass.hide.call(this);
    },

    /*
     * Function: getFormItems
     * 
     * Get form default items (layer's name) and adds this.getPersonalizedItems
     * 
     */
    getFormItems: function(){        

        var items = new Array();
        var layerName = this.layerRecord && this.layerRecord.getLayer() 
                    ? this.layerRecord.getLayer().name : '';
        this.layerName = layerName;
        
        var personalized;
        if(!!this.layerType
            && !!this.GET_FORM_ITEMS_FUNCTIONS[this.layerType]){
            personalized = this.GET_FORM_ITEMS_FUNCTIONS[this.layerType]();
        }else{
            personalized = this.getPersonalizedItems();
        }
        for(var i= 0; i < personalized.length; i++){
            items.push(personalized[i]);
        }
        
        return items;
    },

    /*
     * Function: getPersonalizedItems
     * 
     * Return an array to be added to the form. 
     * Must be overwritten by child classes.
     * 
     */
    getPersonalizedItems: function (){
        var items = new Array();
        var fieldLabel = this.labelLayerName ? this.labelLayerName : this.target.labelLayerName;
        var value = this.layerName ? this.layerName : this.target.layerName;
        var emptyText = this.selectNameText ? this.selectNameText : this.target.selectNameText;
        var changeFunction = this.setLayerName ? this.setLayerName : this.target.setLayerName;

        items.push({
            fieldLabel : fieldLabel,
            name : 'layerName',
            value: value,
            allowBlank : false,
            emptyText: emptyText,
            change: changeFunction
        }); 
        return items;
    },

    setLayerName: function(newName){
        this.layerName = newName;
    },

    /*
     * Function: getPersonalizedItemsWMS
     * 
     * Return an array to be added to the form. 
     * Must be overwritten by child classes.
     * 
     */
    getPersonalizedItemsWMS: function (){
        if(!this.target){
            this.target = this;
        }
        return this.target.getPersonalizedItems();
    },

    /*
     * Function: getPersonalizedItemsWFS
     * 
     * Return an array to be added to the form 
     * for WFS layers
     * 
     */
    getPersonalizedItemsWFS: function (){
        var items = this.target 
            && this.target.getPersonalizedItems ?
            this.target.getPersonalizedItems() : this.getPersonalizedItems();
        items.push({
            fieldLabel : this.target.labelLayerMaxFeatures,
            name : 'maxFeatures',
            allowBlank : false,
            emptyText: this.target.selectMaxFeature
        }); 
        return items;
    },

    /*
     * Function: getEmptyPersonalizedItems
     * 
     * Return an array empty array as personalized items.
     * Used in KML layers
     * 
     */
    getEmptyPersonalizedItems: function (){
        return new Array();
    },

    /*
     * Function: getParamsToSubmit
     * 
     * Return the parameters to be submit on layer save 
     * 
     */
    getParamsToSubmit: function(){

        if(!!this.paramsToSave){
            return this.paramsToSave;
        }

        var layer = this.layerRecord.getLayer();

        var formValues = this.items.items[0].form.getValues();
        this.layerName = formValues.layerName;

        if(!!this.layerType
            && !!this.GET_PARAMS_FUNCTIONS[this.layerType]){
            return this.GET_PARAMS_FUNCTIONS[this.layerType](layer);
        }

        //  unknown type
        return {};
    },

    /*
     * Function: getParamsToSubmitWMS
     * 
     * Return the parameters to be submit on WMS layer save 
     * 
     */
    getParamsToSubmitWMS: function(layer){
        // Get the layer params to save them
        var properties = {
                transparent: layer.transparent ? layer.transparent : true,
                buffer: layer.buffer ? layer.buffer: 0,
                visibility: layer.visibility ? layer.visibility : true,
                opacity: layer.opacity ? layer.opacity : 1,
                maxExtent: layer.maxExtent.toString(),
                format: layer.params.FORMAT,
                layers: layer.params.LAYERS
                //TODO:  ,
                // format: layer.params.FORMAT,
                // layers: layer.params.LAYERS
                // ,
                // order: map.layers.length
        };

        var params = {
                name: this.target.layerName,
                server_resource: layer.url,
                type: this.target.KNOWN_TYPES.WMS,
                properties: properties
                // // for KML, GML...
                // idFile: this.idFile, 
                // properties:{
                //     externalProjection: this.externalProjection
                // }
        };
        
        return params;
    },

    /*
     * Function: getDefaultParamsToSubmit
     * 
     * Return the parameters to be submit by default
     * 
     */
    getDefaultParamsToSubmit: function (){
        return !!this.paramsToSave ? 
            this.paramsToSave : 
                ((!!this.target && !!this.target.paramsToSave)
                    ? this.target.paramsToSave : null);
    },

    /*
     * Function: getParamsToSubmitWFS
     * 
     * Return the parameters to be submit on WFS layer save 
     * 
     */
    getParamsToSubmitWFS: function(layer){
        var formValues = this.target.items.items[0].form.getValues();

        // Get the layer params to save them
        var params = {
                name: formValues.layerName,
                server_resource: layer.protocol.url,
                type: this.target.KNOWN_TYPES.WFS,
                folderId: this.target.folderID,
                properties:{ 
                    //TODO: order: map.layers.length
                }
        };

        this.target.copyAllPosibleProperties(layer.protocol, params.properties);
        this.target.copyAllPosibleProperties(layer.protocol.format, params.properties);
        this.target.copyAllPosibleProperties(layer.protocol.options, params.properties);
        
        params.properties['maxFeatures'] = formValues.maxFeatures;
        
        return params;
    },

    copyAllPosibleProperties: function (fromMap, toMap){
        for(var key in fromMap){
            if (!!fromMap[key]
                && ((typeof fromMap[key] == "string")
                    || (typeof fromMap[key] == "number")
                    || (typeof fromMap[key] == "boolean"))) {
                toMap[key] = fromMap[key];
            }
        }
    },

    /*
     * Function: submitForm
     * 
     * Save the layer 
     * 
     */
    submitForm : function() {

        if(!this.items.items[0].form.isValid()){
            return;
        }

        // Mark as saved
        this.markIsSaved = true;
        
        // Get the layer params to save them
        var params = this.getParamsToSubmit();
        
        if(!!this.layerRecord
            && !! this.layerRecord.getLayer()){

            var layer = this.layerRecord.getLayer();

            if(layer.metadata && layer.metadata.layerResourceId) {
                // Temporal layers saved in the server.
                 app.persistenceGeoContext.saveLayerResource(
                   layer.metadata.layerResourceId, params, this.onLayerSave, this.onSaveLayerException,this);   
            } else if(params.type=="WFS" || params.type=="WMS") {
                // Remote temporal layers.
                app.persistenceGeoContext.saveLayerFromParams(params, this.onLayerSave, this.onSaveLayerException,this);
            } else {
                throw new Error("Unsupported temporal layer for persistence.!")
            }
        }
    },

    /**
     * method [updateLayer]
     * Update layer by name removing and saving new
     **/
    updateLayer: function (layer){
        var layerToRemove = this.layerRecord.getLayer();
        this.target.mapPanel.map.removeLayer(layerToRemove);
        this.target.mapPanel.map.addLayer(layer);
    },

    onLayerSave: function (layer){
        
        
        this.updateLayer(layer);
        Ext.Msg.alert(this.saveLayerTitleText, String.format(this.saveLayerText, layer.name));
        

        if(this.layerType
            == this.KNOWN_TYPES.KML){
            this.layer = layer;
            this.target.mapPanel.map.addLayer(layer);

            // restore savemode
            if(this.authorized){
                this.target.persistenceGeoContext.saveModeActive = this.target.persistenceGeoContext.SAVE_MODES.GROUP;
            }
        
            layer.events.register("loadend", this, this.onLoadEnd);
        }

        this.hide();
    },

    onSaveLayerException: function (e){
        Ext.Msg.alert(this.scope.saveLayerErrorTitleText, String.format(this.scope.saveLayerErrorText, this.scope.layerName));

        this.scope.hide();

        //TODO: handle exception
        if(!!e
            && !!e.stack 
            && !!console
            && !!console.log){
            console.log(e.stack);
        }
    },

    /** api: method[onLoadEnd]
     */
    onLoadEnd: function(){
        this.zoomToExtent(this.layer);
    },

    /** api: method[zoomToExtent]
     */
    zoomToExtent: function(layer) {
        var dataExtent;
        if (OpenLayers.Layer.Vector) {
            dataExtent = layer instanceof OpenLayers.Layer.Vector &&
                layer.getDataExtent();
        }
        var extent = layer.restrictedExtent || dataExtent || layer.maxExtent || map.maxExtent;

        if(extent)
            this.target.mapPanel.map.zoomToExtent(extent);
    }

});

Ext.reg(Viewer.widgets.SaveLayerPanel.prototype.ptype, Viewer.widgets.SaveLayerPanel); 
