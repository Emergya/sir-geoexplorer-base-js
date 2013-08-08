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

// Definimos un tipo para reconocer los nombres con acentos
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

Viewer.dialog.DeleteDataColumn = Ext.extend(Ext.Window, {

    TOOL_POINT: 'Point',
    TOOL_LINE: 'Line',
    TOOL_POLYGON: 'Polygon',

    action: null,

    descriptionTextColumn: "Select the columns you want to delete and then click Save.",
    columnNameLabelText: "Columns avaible",
    deleteColumnWaitMsgText: "Delete columns",
    loadingDataText: "Loading data. Please Wait",
    deleteColumnWaitMsgTitleText: "Processing...",
    deleteColumnTitle: "Delete columns",
    buttonSaveText: "Save",

    singleSuccessText : "The selected column was removed successfully.",
    manySuccessText: "The selected columns were removed successfully-",
    successTitleText: 'Columns Removed',
    errorRemovingText: "An error was found while removing the columns. Please try again.",
    errorSendingText: "An error was found while sending data to the server, please try again.",
    aColumnMustBeSelectedText: "At least one column must be marked to be deleted.",
    errorRetrievingColumnsText: "An error was found while retrieving avalaible column information, please try again.",

    columnNamesCheckBoxes: [],


    STATE_NONE: 0,
    STATE_EDITING: 1,

    ACTION_HIDE: 0,
    ACTION_CLEAR: 1,

    currentState: null,
    activeLayer: null,
    previousFeatures: null,

    constructor: function(config) {

        this.currentState = this.STATE_NONE;

        this.layerController = Viewer.getController('Layers');

        this.listeners = {
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        };

        Viewer.dialog.DeleteDataColumn.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_default_searches_window',
            title: this.deleteColumnTitle,
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
        if(!this.activeLayer) {
            this.activeLayer = new OpenLayers.Layer.Vector("tmp layer",{displayInLayerSwitcher:false});
            Viewer.getMapPanel().map.addLayer(this.activeLayer);
        }
    },

    onBeforeRender: function() {

        var c1 = {
            xtype: 'panel',
            id: 'c1',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            height: 400,
            items: [{
                xtype: 'form',
                id: 'loadData',
                frame: true,
                autoHeight: true,
                labelWidth: 100,
                defaults: {
                    anchor: '90%',
                    allowBlank: false,
                    msgTarget: 'side'
                },
                items:[{
                    xtype: 'label',
                    cls: 'toolDescription',
                    text: this.loadingDataText
                },
                {
                    xtype: 'textfield',
                    hidden: true,
                    id: 'layerSelectedId',
                    value: '0'
                }
                , 
                {
                    xtype: 'textfield',
                    hidden: true,
                    id: 'layerSelectedTemporal',
                    value: 'false'
                }]
            }]
        };

        this.add(c1);
        this.loadDataColumns();


        
    },

    loadDataColumns: function () {

        var fp = Ext.ComponentMgr.get('loadData');

        if(app.tools["featuremanager"].layerRecord.data.layer.metadata.temporal) {

            fp.getForm().findField('layerSelectedTemporal').setValue('true');
            fp.getForm().findField('layerSelectedId').setValue(app.tools["featuremanager"].layerRecord.data.layer.metadata.layerResourceId);
        } else {

            fp.getForm().findField('layerSelectedTemporal').setValue('false');
            fp.getForm().findField('layerSelectedId').setValue(app.tools["featuremanager"].layerRecord.data.layer.layerID);
        }

        Ext.getBody().setStyle("cursor", "wait");
        fp.getForm().submit({
            scope: this,
            url: '../../deleteDataColumn/loadData',
            success: function(fp, o) {
                var resp = Ext.util.JSON.decode(o.response.responseText);
                if(resp && resp.success && resp.data && resp.data.status === "error") {
                    Ext.Msg.alert('Error', resp.data.message);
                    return false;
                } else if (!resp || !resp.success || !resp.data) {
                    Ext.Msg.alert('Error', this.errorRetrievingColumnsText);
                    return false;
                }

                this.columnNamesCheckBoxes = [];

                var names = resp.data.columnNames;
                for (i = 0; i < names.length; i++){
                    var checkBox = {
                        boxLabel: names[i], 
                        name: names[i], 
                        inputValue: names[i]
                    };
                    this.columnNamesCheckBoxes.push(checkBox);
                }
                
                var c2 = {
                    xtype: 'panel',
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },
                    height: 400,
                    bbar: [
                        
                            '->', // greedy spacer so that the buttons are aligned to each side
                        {
                            id: 'move-next',
                            text: this.buttonSaveText,
                            handler: this.deleteColumnCall.createDelegate(this)
                        }
                    ],
                    items: [{
                        xtype: 'form',
                        id: 'deleteColumnsForm',
                        frame: true,
                        autoHeight: false,
                        anchor: '100%',
                        labelWidth: 100,
                        defaults: {
                            anchor: '90%',
                            allowBlank: false,
                            msgTarget: 'side'
                        },
                        items:[
                            {
                                xtype: 'label',
                                cls: 'toolDescription',
                                text: this.descriptionTextColumn
                            }, 
                            {
                                xtype: 'checkboxgroup',
                                id: 'columnNamesGroup',
                                fieldLabel: this.columnNameLabelText,
                                columns: 1,
                                vertical: true,
                                items: this.columnNamesCheckBoxes,
                                height: 125,
                                style:"overflow-y: auto;"
                            },
                            {
                                xtype: 'textfield',
                                id: 'columnsSelectedString', 
                                hidden: true  
                            }
                        ]
                    },{
                        xtype: 'form',
                        autoHeight: false,
                        anchor: '100%',
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

                var c1d = Ext.ComponentMgr.get('c1');
                c1d.destroy();

                this.add(c2);
                this.doLayout();
                Ext.getBody().setStyle("cursor", "default");

                
            }, 
            failure: function(form, action) {
                Ext.Msg.alert('Error', this.errorSendingText);
            }
        });
    },

    deleteColumnCall: function() {
        var fp = Ext.ComponentMgr.get('deleteColumnsForm');

        var cks = Ext.ComponentMgr.get('columnNamesGroup');
        var itemsTextField = Ext.ComponentMgr.get('columnsSelectedString');

        var itemsSelected = "";

        var selectedCount = 0;
        for(i = 0; i < cks.items.length; i++) {
            if (cks.items.get(i).checked) {
                selectedCount++;
                itemsSelected += cks.items.get(i).inputValue + ',';
            }
        }
        itemsTextField.setValue(itemsSelected);

        if (fp.getForm().isValid() && itemsSelected !== "") {
            fp.getForm().submit({
                scope: this,
                url: '../../deleteDataColumn/step1',
                waitMsg: this.deleteColumnWaitMsgTitleText,
                waitTitle: this.deleteColumnWaitMsgText,
                success: function(fp, o) {
                    var resp = Ext.util.JSON.decode(o.response.responseText);
                    if(resp && resp.success && resp.data && resp.data.status === "error") {
                        Ext.Msg.alert('Error', resp.data.message);
                    } else if (resp && resp.success) {
                        this.close();
                        Ext.Msg.alert(this.successTitleText, selectedCount==1?this.singleSuccessText:this.manySuccessText);
                    } else {
                        Ext.Msg.alert('Error', this.errorRemovingText);
                    }
                    app.tools["featuremanager"].refreshSchemaInUse();

                    // #83776: query results grid columns are updated when a column is deleted.
                    app.tools["featuremanager"].refreshSchemaInUse();
                },
                failure: function(form, action) {
                    Ext.Msg.alert('Error', this.errorSendingText);
                }
            });
        } else {
            Ext.Msg.alert('Error', this.aColumnMustBeSelectedText);
        }
    }
});
