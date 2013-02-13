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
Viewer.widgets.LayerPanel = Ext.extend(Ext.TabPanel, {

    ptype: "vw_layerpanel",
    
    /** api: config[layerRecord]
     *  ``GeoExt.data.LayerRecord``
     *  Show properties for this layer record.
     */
    layerRecord: null,

    /** api: config[source]
     *  ``gxp.plugins.LayerSource``
     *  Source for the layer. Optional. If not provided, ``sameOriginStyling``
     *  will be ignored.
     */
    source: null,
    
    /** api: config[styling]
     *  ``Boolean``
     *  Show a "Styles" tab. Default is true.
     */
    styling: true,
    
    /** api: config[sameOriginStyling]
     *  ``Boolean``
     *  Only allow editing of styles for layers whose sources have a URL that
     *  matches the origin of this application.  It is strongly discouraged to 
     *  do styling through the proxy as all authorization headers and cookies 
     *  are shared with all remotesources.  Default is ``true``.
     */
    sameOriginStyling: true,

    /** api: config[rasterStyling]
     *  ``Boolean`` If set to true, single-band raster styling will be
     *  supported.  Default is ``false``.
     */
    rasterStyling: false,

    /** private: property[transparent]
     *  ``Boolean``
     *  Used to store the previous state of the transparent checkbox before
     *  changing the image format to jpeg (and automagically changing
     *  the checkbox to disabled and unchecked).
     */
    transparent: null,
    
    /** private: property[editableStyles]
     *  ``Boolean``
     */
    editableStyles: false,
    
    /** api: config[activeTab]
     *  ``String or Number``
     *  A string id or the numeric index of the tab that should be initially
     *  activated on render.  Defaults to ``0``.
     */
    activeTab: 0,
    
    /** api: config[border]
     *  ``Boolean``
     *  Display a border around the panel.  Defaults to ``false``.
     */
    border: false,
    
    /** api: config[imageFormats]
     *  ``RegEx`` Regular expression used to test browser friendly formats for
     *  GetMap requests.  The formats displayed will those from the record that
     *  match this expression.  Default is ``/png|gif|jpe?g/i``.
     */
    imageFormats: /png|gif|jpe?g/i,

    /** i18n */
    saveTitleText: "Save",
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

    initComponent: function() {
        this.items = new Array();
        this.items.push(this.createSavePanel());

        Viewer.widgets.LayerPanel.superclass.initComponent.call(this);
    },

    /** private: method[createSavePanel]
     *  :arg url: ``String`` url to save styles to
     *
     *  Creates the Styles panel.
     */
    createSavePanel: function() {
        var savePanel = new Viewer.widgets.SaveLayerPanel();
        savePanel.layerRecord = this.layerRecord;
        return savePanel;
    } ,

    /*
     * Function: getFormItems
     * 
     * Get form default items (layer's name) and adds this.getPersonalizedItems
     * 
     */
    getFormItems: function(){
        var items = new Array();
        items.push({
            id : "inputName",
            fieldLabel : this.labelLayerName,
            name : 'layerName',
            allowBlank : false,
            emptyText: this.selectNameText
        }); 
        
        var personalized = this.getPersonalizedItems();
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
        return new Array();
    },

    /*
     * Function: getParamsToSubmit
     * 
     * Return the parameters to be submit on layer save 
     * 
     */
    getParamsToSubmit: function(){
        var type = "";
        if(this.displayClass == "LoadKML"){
            type = "KML";
        }else if(this.displayClass == "LoadGML"){
            type = "GML";
        }

        var properties = {
            "externalProjection": this.externalProjection
        };

        var params = {
                "name": this.nameLayer,
                "server_resource": '',
                "type": type,
                "idFile": this.idFile,
                "properties": properties
        };

        return params;
    },

    /*
     * Function: submitForm
     * 
     * Save the layer 
     * 
     */
    submitForm : function() {
        
        // Get the layer params to save them
        var params = this.getParamsToSubmit();
        
        //TODO: get user info
        var pgeoContext = new PersistenceGeo.Context({
            map: this.map
        });


        pgeoContext.addLayer(this.layerRecord.getLayer());
    }
});

Ext.reg(Viewer.widgets.LayerPanel.prototype.ptype, Viewer.widgets.LayerPanel); 
