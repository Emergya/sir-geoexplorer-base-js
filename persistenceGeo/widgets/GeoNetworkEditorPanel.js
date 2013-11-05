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

    /** api: config[panelVertical] */
    panelVertical: true,

    /** api: config[overrideExtent] */
    overrideExtent: true,

    /**
     * private: property[controller]
     * ``PersistenceGeo.tree.MakeLayerPublic`` controller of the editor
     */
    controller: null,

    COMMON_DATA: {        
        title: ".md.title",
        abstract: ".md.large",
        // Contact info
        contact_name: "tr[id^='gmd:pointOfContact'] tr[id^='gmd:individualName'] input.md",
        contact_group: "tr[id^='gmd:pointOfContact'] tr[id^='gmd:organisationName'] input.md",
        contact_phone: "tr[id^='gmd:pointOfContact'] tr[id^='gmd:voice'] input.md",
        contact_mail: "tr[id^='gmd:pointOfContact'] tr[id^='gmd:electronicMailAddress'] input.md",
        contact_country: "tr[id^='gmd:pointOfContact'] tr[id^='gmd:country'] input.md",
        // Author info
        author_name: "tr[id^='gmd:contact'] tr[id^='gmd:individualName'] input.md",
        author_group: "tr[id^='gmd:contact'] tr[id^='gmd:organisationName'] input.md",
        author_phone: "tr[id^='gmd:contact'] tr[id^='gmd:voice'] input.md",
        author_mail: "tr[id^='gmd:contact'] tr[id^='gmd:electronicMailAddress'] input.md",
        author_country: "tr[id^='gmd:contact'] tr[id^='gmd:country'] input.md",

        language: "tr[id^='gmd:language'] select",

        // Online (link) info, the table is the second one in the container, although it seems to be the first.
        online_url: "tr[id^='gmd:CI_OnlineResource']:nth-child(2) tr[id^='gmd:URL'] input",
        online_label: "tr[id^='gmd:CI_OnlineResource']:nth-child(2) tr[id^='di_'] input",
        // Online (get map) url
        get_map_url: "tr[id^='gmd:CI_OnlineResource']:last-child tr[id^='gmd:URL'] input",      
        resource_name: "tr[id^='gmd:CI_OnlineResource']:last-child tr[id^='di_'] input",
        resource_label: "tr[id^='gmd:CI_OnlineResource']:last-child tr[id^='gmd:description'] textarea"
    },

    /** private: method[initComponent] 
     *  Initializes the Editor panel.
     */
    initComponent: function() {
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



        var tbarConfig = {
            editor: panel
        };
        Ext.apply(tbarConfig, this.tbarConfig);
        this.toolbar = new PersistenceGeo.widgets.GeoNetworkEditorToolbar(tbarConfig);

        var editorPanel = {
            region: 'center',
            split: true,
            autoScroll: true,
            tbar: this.toolbar,
            //            minHeigth: 400,
            items: [this.editorMainPanel]
        };
        this.add(editorPanel);

        this.editorMainPanel.on("render",function() {
            // We show a loading indicator in the topmost container 
            //before updating the  metadata form and hide it  when its loaded.
            var w = this.editorMainPanel;
            do {
                w = w.ownerCt;
            } while (w.ownerCt);

            this.loadMask = new Ext.LoadMask(w.getEl());
            var updater = this.editorMainPanel.getUpdater();
            updater.on("beforeupdate", function(){
                this.loadMask.show();
            },this);

            updater.on("update", function(){
                this.loadMask.hide();
            },this);
        },this);

       
        // Init utility panels
        this.validationPanel = new GeoNetwork.editor.ValidationPanel(Ext.applyIf({
            metadataId: this.metadataId,
            editor: this,
            serviceUrl: this.catalogue.services.mdValidate,
            columnWidth: 0.33,
            collapsible: this.panelVertical,
            collapsed: this.panelVertical
        }, this.utilityPanelConfig.validationPanel));

        // TODO : Add option to not create help panel
        this.helpPanel = new GeoNetwork.editor.HelpPanel(Ext.applyIf({
            editor: this,
            html: '',
            cls: "helpPanel",
            columnWidth: 0.33,
            collapsible: this.panelVertical
        }, this.utilityPanelConfig.helpPanel));

        this.relationPanel = new GeoNetwork.editor.LinkedMetadataPanel(Ext.applyIf({
            editor: this,
            columnWidth: 0.33,
            metadataId: this.metadataId,
            metadataSchema: this.metadataSchema,
            catalogue: this.catalogue,
            serviceUrl: this.catalogue.services.mdRelation,
            imagePath: this.selectionPanelImgPath
        }, this.utilityPanelConfig.relationPanel));

        this.suggestionPanel = new GeoNetwork.editor.SuggestionsPanel(Ext.applyIf({
            metadataId: this.metadataId,
            editor: this, 
            catalogue: this.catalogue
        }, this.utilityPanelConfig.suggestionPanel));

        this.optionsPanel = this.add({
            region: this.panelVertical?'east':'south',
            split: true,
            collapsible: true,
            collapsed: this.utilityPanelCollapsed,
            hideCollapseTool: true,
            collapseMode: 'mini',
            autoScroll: true,
            layout: this.panelVertical?'auto':'column',
            minWidth: 280,
            width: 280,
            height: 280,
            minHeight: 280,
            items: [
                // TODO: Fix integration and uncomment panels!!
                this.relationPanel, 
                // this.suggestionPanel,
                this.validationPanel,
                this.helpPanel
            ]
        });

        if(!this.panelVertical) {
            this.optionsPanel.on("expand",function() {                
                this.validationPanel.validate();
            },this);
        }

        /** private: event[metadataUpdated] 
         *  Fires after the metadata form is loaded (save, reset, change view mode)
         *  and the form is initialized (eg. calendar, map widget).
         */
        /** private: event[editorClosed] 
         *  Fires before the editor is closed.
         */
        this.addEvents('metadataUpdated', 'editorClosed');

        

        this.on('added', function(el, container, index) {
            if (container) {
                this.setContainer(container);
            }
            this.initPanelLayout();
        }, this);

        
        //        this.on('hidden', this.onEditorClosed, this);
    },

    getFormValue: function(name) {
        //TODO: improve this function
        return this.COMMON_DATA[name] ? $(this.COMMON_DATA[name]) : null;
    },

    setFormValue: function(name, value) {
        var parameter = this.getFormValue(name);
        if (parameter) {
            parameter.val(value);
        }

    },

    initWithController: function(controller) {
        this.controller = controller;
        var jsonData = controller.getJsonData();
        // overwrite form data
        for (var formParam in jsonData.formData) {
            this.setFormValue(formParam, jsonData.formData[formParam]);
        }
        // Handle extent
        this.catalogue.extentMap.mapPanel.map.zoomToExtent(GeoNetwork.map.EXTENT);
        if (this.overrideExtent && jsonData.layerSelected) {
            var layer = jsonData.layerSelected.getLayer();
            if (layer.boundCalculated) {
                this.catalogue.extentMap.setBbox(layer.boundCalculated);
            } else {
                this.catalogue.extentMap.setBbox(GeoNetwork.map.EXTENT);
            }
            // TODO: Add a compatible layer
            //this.catalogue.extentMap.mapPanel.map.addLayer(layer);
        }
    },

    /** private: method[onMetadataUpdated]
     *  Contructor method.
     */
    onMetadataUpdated: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.onMetadataUpdated.call(this);
        this.initWithController(this.controller);
    },


    /** api: method[finish]
     *
     *  Save current editing session and close the editor.
     */
    finish: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.finish.call(this);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'finish', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }
    },
    /** api: method[save]
     *
     *  Save current editing session.
     */
    save: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.save.call(this);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'finish', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }
    },
    callAction: function(action) {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.callAction.call(this, arguments);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'callAction', action);
        }
    },
    /** api: method[validate]
     *
     *  Validate metadata and open validation panel.
     *
     */
    validate: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.validate.call(this);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'validate', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }
    },
    /** api: method[reset]
     *
     *  Reset current editing session calling 'metadata.update.forget.new' service.
     */
    reset: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.reset.call(this);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'reset');
        }
    },
    /** api: method[cancel]
     *
     *  Cancel current editing session and close the editor calling 'metadata.update.forgetandfinish' service.
     */
    cancel: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.cancel.call(this);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'cancel', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }
    },

    /** api: method[publicationRequest]
     *
     * Saves the current editing sesion and requests publication of the layer in SIR-AMIN.
     */
    publicationRequest: function() {
        PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.save.call(this);
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'publicationRequest', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }
    },

    /** api: method[doPublication]
     *
     * Saves the current editing sesion and marks the layer as published in SIR-AMIN.
     */
    doPublication: function() {       
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'doPublication', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }

        //PersistenceGeo.widgets.GeoNetworkEditorPanel.superclass.save.call(this);
    },


    /** api: method[doPublication]
     *
     * Cancels the current edition and marks the publication request as rejected in SIR-Admin.
     */
    doRejection: function() {
        if (this.controller) {
            this.controller.fireEvent('editorpanelaction', 'doRejection', {
                metadataUuid: this.relationPanel.metadataUuid,
                metadataId: this.metadataId
            });
        }
    }

});

Ext.preg(PersistenceGeo.widgets.GeoNetworkEditorPanel.prototype.ptype, PersistenceGeo.widgets.GeoNetworkEditorPanel);