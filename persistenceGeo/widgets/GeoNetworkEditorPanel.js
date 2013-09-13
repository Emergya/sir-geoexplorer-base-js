/*
 * GeoNetworkEditorPanel.js Copyright (C) 2013 This file is part of PersistenceGeo project
 *
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 *
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = GeoNetworkEditorPanel
 */
Ext.namespace("PersistenceGeo.widgets");

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = GeoNetworkEditorPanel
 *  base_link = `GeoNetwork.editor.EditorPanel <http://geonetwork-opensource.org/manuals/2.10.0/eng/widgets/lib/web-client/jst/GeoNetwork/widgets/editor/EditorPanel.html>`_
 */

/** api: constructor 
 *  .. class:: GeoNetworkEditorPanel(config)
 *
 *     Create a GeoNetwork editor panel.
 * 
 *  TODO: Import more data:
 *   * Generate a thumbnail 
 *   * Generate a large_thumbnail 
 *   * Generate a date
 *   * Generate a version
 *   * Generate legal constraints 
 *   * Generate spatial resolution
 *   * Generate author info from pgeo context
 *   * Force spanish everywere
 *   * Remove multi-lengual by default (in template) 
 *   * Improve online info: WFS, WPS, download
 *
 *
 *  Known limitation: only one editor panel could be created in one application
 *
 */
PersistenceGeo.widgets.GeoNetworkEditorPanel = Ext.extend(GeoNetwork.editor.EditorPanel, {

    /** api: ptype = pgeo_gneditor */
    ptype: "pgeo_gneditor",


    /**
     * private: property[controller]
     * ``PersistenceGeo.tree.MakeLayerPublic`` controller of the editor
     */
    controller: null,

    COMMON_DATA:{
        title: 91,
        abstract: 116,
        // Contact info
        contact_name: 137,
        contact_group:139,
        contact_phone: 147,
        contact_mail: 163,
        contact_country: 161,
        // Author info
        author_name: 11,
        author_group:13,
        author_phone: 21,
        author_mail: 37,
        author_country: 35,
        // Online (download) info
        online_url: 249,
        // Online (get map) url
        get_map_url: 269
    },
    
    /** private: method[initComponent] 
     *  Initializes the Editor panel.
     */
    initComponent: function(){
        var optionsPanel;
        
        Ext.applyIf(this, this.defaultConfig);
        
        this.disabled = (this.metadataId ? false : true);
        this.lang = (this.catalogue.lang ? this.catalogue.lang : 'eng');
        
        this.editUrl = this.catalogue.services.mdEdit;
        this.createUrl = this.catalogue.services.mdCreate;
        this.updateUrl = this.catalogue.services.mdUpdate;
        
        
        GeoNetwork.editor.EditorPanel.superclass.initComponent.call(this);
        
        panel = this;
        
        
        
        // Create the main editor panel with toolbar
        this.editorMainPanel = new Ext.Panel({
            border: false,
            frame: false,
            id: 'editorMainPanel'
        });
        
        
        var tbarConfig = {editor: panel};
        Ext.apply(tbarConfig, this.tbarConfig);
        this.toolbar = new GeoNetwork.editor.EditorToolbar(tbarConfig);
        
        var editorPanel = {
            region: 'center',
            split: true,
            autoScroll: true,
            tbar: this.toolbar,
//            minHeigth: 400,
            items: [this.editorMainPanel]
        };
        this.add(editorPanel);
        
        
        
        // Init utility panels
        this.validationPanel = new GeoNetwork.editor.ValidationPanel(Ext.applyIf({
            metadataId: this.metadataId,
            editor: this,
            serviceUrl: this.catalogue.services.mdValidate
        }, this.utilityPanelConfig.validationPanel));
        
        // TODO : Add option to not create help panel
        this.helpPanel = new GeoNetwork.editor.HelpPanel(Ext.applyIf({
            editor: this,
            html: ''
        }, this.utilityPanelConfig.helpPanel));
        
        this.relationPanel = new GeoNetwork.editor.LinkedMetadataPanel(Ext.applyIf({
            editor: this,
            metadataId: this.metadataId,
            metadataSchema: this.metadataSchema,
            catalogue: this.catalogue,
            serviceUrl: this.catalogue.services.mdRelation,
            imagePath: this.selectionPanelImgPath
        }, this.utilityPanelConfig.relationPanel));
        
        this.suggestionPanel = new GeoNetwork.editor.SuggestionsPanel(Ext.applyIf({
            metadataId : this.metadataId,
            editor: this,
            catalogue: this.catalogue
        }, this.utilityPanelConfig.suggestionPanel));
        
        optionsPanel = {
            region: 'east',
            split: true,
            collapsible: true,
            collapsed: this.utilityPanelCollapsed,
            hideCollapseTool: true,
            collapseMode: 'mini',
            autoScroll: true,
            // layout: 'fit',
            minWidth: 280,
            width: 280,
            items: [
                this.relationPanel, 
                this.suggestionPanel,
                this.validationPanel, 
                this.helpPanel]
        };
        this.add(optionsPanel);
        /** private: event[metadataUpdated] 
         *  Fires after the metadata form is loaded (save, reset, change view mode)
         *  and the form is initialized (eg. calendar, map widget).
         */
        /** private: event[editorClosed] 
         *  Fires before the editor is closed.
         */
        this.addEvents('metadataUpdated', 'editorClosed');
        
        this.on('added', function (el, container, index) {
            if (container) {
                this.setContainer(container);
            }
            this.initPanelLayout();
        }, this);
        
//        this.on('hidden', this.onEditorClosed, this);
    },

    getFormValue: function(name){
        //TODO: improve this function
        return this.COMMON_DATA[name]? $("#_" + this.COMMON_DATA[name]): null;
    },

    setFormValue: function(name, value){
        var parameter = this.getFormValue(name);
        if(parameter){
            parameter.val(value);
        }

    },

    initWithController: function(controller){
        this.controller = controller;
        var jsonData = controller.getJsonData();
        // overwrite form data
        for(var formParam in jsonData.formData){
            this.setFormValue(formParam, jsonData.formData[formParam]);
        }
        // Handle extent
        this.catalogue.extentMap.mapPanel.map.zoomToExtent(GeoNetwork.map.EXTENT);
        if(jsonData.layerSelected){
            var layer = jsonData.layerSelected.getLayer();
            if(layer.boundCalculated){
                this.catalogue.extentMap.setBbox(layer.boundCalculated);
            }else{
                this.catalogue.extentMap.setBbox(GeoNetwork.map.EXTENT);
            }
            // TODO: Add a compatible layer
            //this.catalogue.extentMap.mapPanel.map.addLayer(layer);
        }
    },

    /** private: method[onMetadataUpdated]
     *  Contructor method.
     */
    onMetadataUpdated: function () {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.onMetadataUpdated.call(this);
        this.initWithController(this.controller);
    },


    /** api: method[finish]
     * 
     *  Save current editing session and close the editor.
     */
    finish: function(){
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.finish.call(this);
        if (this.controller){
            this.controller.fireEvent('editorpanelaction', 'finish', this.relationPanel.metadataUuid);
        }
    },
    /** api: method[save]
     * 
     *  Save current editing session.
     */
    save: function(){
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.save.call(this);
        if (this.controller){
            this.controller.fireEvent('editorpanelaction', 'finish');
        }
    },
    callAction: function(action){
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.callAction.call(this, arguments);
        if (this.controller){
            this.controller.fireEvent('editorpanelaction', 'callAction', action);
        }
    },
    /** api: method[validate]
     * 
     *  Validate metadata and open validation panel.
     *  
     */
    validate: function(){
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.validate.call(this);
        if (this.controller){
            this.controller.fireEvent('editorpanelaction', 'validate');
        }
    },
    /** api: method[reset]
     * 
     *  Reset current editing session calling 'metadata.update.forget.new' service.
     */
    reset: function(){
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.reset.call(this);
        if (this.controller){
            this.controller.fireEvent('editorpanelaction', 'reset');
        }
    },
    /** api: method[cancel]
     * 
     *  Cancel current editing session and close the editor calling 'metadata.update.forgetandfinish' service.
     */
    cancel: function(){
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.cancel.call(this);
        if (this.controller){
            this.controller.fireEvent('editorpanelaction', 'cancel');
        }
    }

});

Ext.preg(PersistenceGeo.widgets.GeoNetworkEditorPanel.prototype.ptype, PersistenceGeo.widgets.GeoNetworkEditorPanel);