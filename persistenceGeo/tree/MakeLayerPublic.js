/*
 * MakeLayerPublic.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 *  module = PersistenceGeo.tree
 *  class = MakeLayerPublic
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.MakeLayerPublic
 * 
 * Make a layer public. See #87022
 * 
 */
PersistenceGeo.widgets.MakeLayerPublic = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = pgeo_makelayerpublic */
    ptype: "pgeo_makelayerpublic",

    /** i18n **/
    toolText: "Publish",
    toolTooltipText: "Make a publish request",
    toolWindowText: "Layer {0} publish request",
    toolIconCls: 'gxp-icon-savelayers',
    formActionFieldText: "Target action",
    formActionFieldValueText: "Publish as new layer",
    formNameFieldText: "Target name",
    formNameFieldValueText: "Name of the layer",
    formTemplateFieldText: "Template",
    formTemplateFieldValueText: "ISO 19119",

    /** Window size **/
    windowWidth: 400,
    windowHeight: 200,

    /** api: config[checkUserInfo]
     *  ``Boolean``
     *  Check user logged info to active this tool
     */
    checkUserInfo: false,

    /**
     * private: method[init] :arg target: ``Object`` The object initializing
     * this plugin.
     */
    init: function(target) {
        PersistenceGeo.widgets.MakeLayerPublic.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

    },

    /** api: method[addActions]
     */
    addActions: function() {     

        var actions = PersistenceGeo.widgets.MakeLayerPublic.superclass.addActions.apply(this, [{
                menuText: this.toolText,
                iconCls: this.toolIconCls,
                disabled: false,
                tooltip: this.toolTooltipText,
                handler: function() {
                    var record = this._selectedLayer;
                    if (record) {
                        this.showWindow(record);
                    }
                },
                scope: this
            }
        ]); 

        this.launchAction = actions[0];

        this.target.on("layerselectionchange", function(record) {
            this._selectedLayer = record;
            this.checkIfEnable(record);
        }, this);
        var enforceOne = function(store) {
            if(!!this.launchAction){
                this.launchAction.setDisabled(!this._selectedLayer || store.getCount() <= 1);
            }
        };
        this.target.mapPanel.layers.on({
            "add": enforceOne,
            "remove": enforceOne
        });

        return actions;
    },

    /**
     * private: method[showWindow]
     * Show a dialog
     */
    showWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        var publicLayerWindow;
        // Create a window to choose the template and the group
        if (!publicLayerWindow) {
            
            publicLayerWindow = new Ext.Window({
                title:  String.format(this.toolWindowText, layer.name),
                width: this.windowWidth,
                height: this.windowHeight,
                layout: 'fit',
                modal: true,
                items: this.getPanel(),
                closeAction: 'hide',
                constrain: true,
                iconCls: 'addIcon'
            });
        }
        publicLayerWindow.show();
    },

    /**
     * private: method[getPanel]
     * Obtain default form panel initialized.
     * TODO: Make all fields as select fields localized
     */
    getPanel: function(layer){

        this.actionField = new Ext.form.TextField({
            fieldLabel: this.formActionFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formActionFieldValueText
        });

        this.nameField = new Ext.form.TextField({
            fieldLabel: this.formNameFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formNameFieldValueText
        });

        this.templateField = new Ext.form.TextField({
            fieldLabel: this.formTemplateFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formTemplateFieldValueText
        });

        var items = [this.actionField, this.nameField, this.templateField];

        this.form = new Ext.form.FormPanel({
            items: items,
            border: false,
            labelWidth: 50,
            bodyStyle: "padding: 15px",
            autoWidth: true,
            autoHeight: true
        });

        return this.form;
    },

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  TODO: enable or disable with user and layer info
     */
    checkIfEnable: function(record) {

        var disable = false;

        this.launchAction.setDisabled(disable); 
    }

});

Ext.preg(PersistenceGeo.widgets.MakeLayerPublic.prototype.ptype, PersistenceGeo.widgets.MakeLayerPublic);