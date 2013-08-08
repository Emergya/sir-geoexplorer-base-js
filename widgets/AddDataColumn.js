/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio José Rodríguez <ajrodriguez@emergya.com>
 */

// Definimos un tipo para reconocer los nombresconacentos
Ext.apply(Ext.form.VTypes, {
    /**
     *
     * @param {String} value The name.
     * @return {Boolean} true if the RegExp test passed, and false if not.
     */
    'alphaNumAccents': function(v) {
        var alphaNumAccentsRegExp = /^[\.a-zA-Z_0-9\'\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00FC\u00DC]+$/;
        return alphaNumAccentsRegExp.test(v);
    },
    'alphaNumAccentsText': 'El nombre solo puede contener números, letras, _ y .',
    'alphaNumAccentsMask': /[\.a-zA-Z_0-9\'\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00FC\u00DC]/i

});

Viewer.dialog.AddDataColumn = Ext.extend(Ext.Window, {

    TOOL_POINT: 'Point',
    TOOL_LINE: 'Line',
    TOOL_POLYGON: 'Polygon',

    action: null,

    columnNameEmptyText: "Enter the name for the new column.",
    buttonSaveText: "Save",
    columnNameLabelText: "Columns's Name",
    createColumnWaitMsgText: "Creating Column. Please wait.",
    createColumnWaitMsgTitleText: "Processing...",
    fieldNameEmptyText: 'Type a name for the field (letters, numbers and _)',
    descriptionTextColumn: 'Enter the name for the new column.',
    columnTypeEmpty: "Column Type",
    columnTypeLabel: "Column type",

    errorSendingDataText: "An error was found while sending data to the server, please try again.",
    errorCreatingColumnText: "An error was found while creating the column, please try again.",
    columnCreationSuccessText: "The column creation was successful.",
    columnCreatedSuccessTitleText: 'Column Created',

    typeString: "String",
    typeNumber: "Number",
    typeDate: "Date",
    
    columnType: null,
    newColumnTitle: "New column",
    columnTypeStore: new Ext.data.ArrayStore({
        fields: [{
            name: 'column',
            type: 'String'
        }, ]
    }),


    STATE_NONE: 0,
    STATE_EDITING: 1,

    ACTION_HIDE: 0,
    ACTION_CLEAR: 1,

    currentState: null,
    activeLayer: null,
    previousFeatures: null,

    constructor: function(config) {

        this.currentState = this.STATE_NONE;

        this.listeners = {
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        };

        this.layerController = Viewer.getController('Layers');

        Viewer.dialog.AddDataColumn.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_default_searches_window',
            title: this.newColumnTitle,
            width: 380,
            height: 250,
            closeAction: 'hide',
            layout: 'fit'
        }, config));

        this.layerController.on({
            layerBeforeSelected: this.onLayerBeforeSelected,
            scope: this
        });
    },

    /**
     * When the current window is shown clean
     * the previous data.
     */
    _onShow: function() {

        this.changeActiveLayer();
        this.currentState = this.STATE_NONE;
    },

    /**
     * This is a callback for the 'beforeclick' event of the
     * layer selector tree.
     * If the active layer hasn't new features changes the active layer.
     * Otherwise shows a dialog and ask for save or discard the new features.
     */
    onLayerBeforeSelected: function(layer) {

        if (this.hidden) {
            return true;
        }

        if (this.currentState == this.STATE_NONE) {
            this.changeActiveLayer();

        } else {
            this.askSaveFeatures(this.ACTION_CLEAR);
            return false;
        }
    },

    /**
     * If the active layer has new features ask for save or discard
     * them before close the current window.
     */
    onBeforeHide: function() {
        if (this.currentState == this.STATE_EDITING) {
            this.askSaveFeatures(this.ACTION_HIDE);
            return false;
        }
    },

    /**
     * Changing the active layer means to clean up the
     * previous layer data.
     * Stores the features the new layer currently has.
     */
    changeActiveLayer: function() {
        if (!this.activeLayer) {
            this.activeLayer = new OpenLayers.Layer.Vector("tmp layer", {
                displayInLayerSwitcher: false
            });
            Viewer.getMapPanel().map.addLayer(this.activeLayer);
        }

        this.activeLayer.removeAllFeatures();
    },

    onBeforeRender: function() {

        var c = {
            xtype: 'panel',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bbar: [

                '->', // greedy spacer so that the buttons are aligned to each side
                {
                    id: 'move-next',
                    text: this.buttonSaveText,
                    handler: this.navHandler.createDelegate(this, [1])
                }
            ],
            items: [{
                xtype: 'form',
                id: 'addColumnForm',
                frame: true,
                autoHeight: true,
                height: 200,
                labelWidth: 100,
                defaults: {
                    anchor: '90%',
                    allowBlank: false,
                    msgTarget: 'side'
                },
                items: [{
                    xtype: 'label',
                    cls: 'toolDescription',
                    text: this.descriptionTextColumn
                }, {
                    xtype: 'textfield',
                    id: 'columnName',
                    emptyText: this.columnNameEmptyText,
                    name: 'columnName',
                    fieldLabel: this.columnNameLabelText
                }, {
                    //tipo columna
                    xtype: 'combo',
                    id: 'columnType',
                    forceSelection: true,
                    emptyText: this.columnTypeEmpty,
                    getListParent: function() {
                        return this.el.up('.x-menu');
                    },
                    store: [
                            this.typeString,
                            this.typeNumber,
                            this.typeDate
                        ],
                    mode: 'local',
                    triggerAction: 'all',
                    listeners: {
                        "select": function(combo) {
                            this.columnType = combo.getValue();
                        },
                        scope: this
                    },
                    displayField: "label",
                    valueField: "value",
                    fieldLabel: this.columnTypeLabel
                }, {
                    xtype: 'textfield',
                    hidden: true,
                    id: 'layerSelectedId',
                    value: '0'
                }, {
                    xtype: 'textfield',
                    hidden: true,
                    id: 'layerSelectedTemporal',
                    value: 'false'
                }]
            }, {
                xtype: 'form',
                autoHeight: true,
                frame: true,
                labelWidth: 100,
                defaults: {
                    emptyText: this.fieldNameEmptyText,
                    anchor: '90%',
                    allowBlank: false,
                    msgTarget: 'side',
                    vtype: 'alphaNumAccents'
                }
            }]
        };

        this.add(c);
    },

    navHandler: function(direction) {

        this.addColumnCall();

    },

    addColumnCall: function() {

        var fp = Ext.ComponentMgr.get('addColumnForm');

        if (app.tools["featuremanager"].layerRecord.data.layer.metadata.temporal) {

            fp.getForm().findField('layerSelectedTemporal').setValue('true');
            fp.getForm().findField('layerSelectedId').setValue(app.tools["featuremanager"].layerRecord.data.layer.metadata.layerResourceId);
        } else {

            fp.getForm().findField('layerSelectedTemporal').setValue('false');
            fp.getForm().findField('layerSelectedId').setValue(app.tools["featuremanager"].layerRecord.data.layer.layerID);
        }

        if (fp.getForm().isValid()) {
            fp.getForm().submit({
                scope: this,
                url: '../../addDataColumn/step1',
                waitMsg: this.createColumnWaitMsgTitleText,
                waitTitle: this.createColumnWaitMsgText,
                success: function(fp, o) {
                    var resp = Ext.util.JSON.decode(o.response.responseText);
                    if (resp && resp.success && resp.data && resp.data.status === "error") {
                        Ext.Msg.alert('Error', resp.data.message);
                    } else if (resp && resp.success) {
                        this.close();
                        Ext.Msg.alert(this.columnCreatedSuccessTitleText, this.columnCreationSuccessText);
                    } else {
                        Ext.Msg.alert('Error', this.errorCreatingColumnText);
                    }
                    app.tools["featuremanager"].refreshSchemaInUse();
                    // Fixes #83776, it wasn't enough
                    app.tools["querymanager"].refreshSchemaInUse();
                },
                failure: function(form, action) {
                    Ext.Msg.alert('Error', this.errorSendingDataText);
                },

                scope: this
            });
        }
    }
});