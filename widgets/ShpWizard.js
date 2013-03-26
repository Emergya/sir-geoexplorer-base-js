/*
 * AddLayers.js
 *
 * Copyright (C) 2013
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
 * Authors:: Juan Luis Rodríguez Ponce (mailto:jlrodriguez@emergya.com)
 * 
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
 

/** api: (define)
 *  module = Viewer.plugins
 *  class = ShpWizard
 *  base_link = `Ext.Window <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Window>`
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: ShpWizard(config)
 *
 *    Upload Shapefiles wizard.
 */
Viewer.plugins.ShpWizard = Ext.extend(Ext.Window, {
	/** api: ptype = vw_shpwizard */
    ptype: "vw_shpwizard",
    step: 0,

    /** i18n **/
    windowTitleText: "Crear nueva capa a partir de SHP",
    fileEmptyText: "Seleccione un ZIP con un archivo SHP",
    layerNameEmptyText: "Escriba un nombre para la capa",
    buttonNextText: "Siguiente",
    layerNameLabelText: "Nombre de la capa",
    fileLabelText: "Achivo SHP",
    chooseFileText: "Examinar...",
    uploadWaitMsgText: "Enviando archivo. Por favor espere.",
    waitTitleMsgText: "Subida de archivo",
    createLayerWaitMsgText: "Actualizando nombres de campos. Por favor espere.",
    createLayerWaitMsgTitleText: "Cambio de nombres",
    fieldNameEmptyText: 'Escriba un nombre para el campo (letras, números, . y _)',
    layerTypeId: null,
    layerResourceId: null,
    
    initComponent: function() {
    	var me = this;
    	this.self = me;
        this.store = new Ext.data.JsonStore({
            // store configs
            autoDestroy: true,
            autoLoad: false,
            storeId: 'oldColumnsStore',
            // reader configs
            root: 'columnsMetadata',
            idProperty: 'name',
            fields: [
               'name', 
                {name:'columnSize', type: 'integer'},
                {name:'lastmod', type:'date'},
                'typeName'
            ],
            sortInfo: {field: 'name', direction:'ASC'}
        });

        var cm = new Ext.grid.ColumnModel({
            defaults: {
                sortable: false
            },
            columns:[
                {
                    id: 'oldName',
                    header: 'Nombre de campo',
                    dataIndex: 'name',
                    width: 220,
                    editor: new Ext.form.TextField({
                        allowBlank: false
                    })
                }
            ]
        });

    	var defaultOptions = {
    		title: this.windowTitleText,
    		width: 500,
    		height: 400,
    		boxMaxHeight: 400,
    		layout: 'card',
    		autoScroll: true,
    		activeItem: 0,
    		bodyStyle: 'padding:15px',
    		defaults: {
    			// applied to each contained panel
    			border: false
    		},
    		bbar: [
	    		
       			'->', // greedy spacer so that the buttons are aligned to each side
        		{
		            id: 'move-next',
		            text: this.buttonNextText,
		            handler: this.navHandler.createDelegate(this, [1])
        		}
    		],
    		items: [
    			{
    				xtype: 'form',
                    id: 'uploadShapeForm',
                    fileUpload: true,
                    frame: true,
                    autoHeight: true,
                    height: 200,
                    labelWidth: 100,
    				defaults: {
    					anchor: '90%',
                        allowBlank: false,
                        msgTarget: 'side'
    				},
                    items:[
                        {
                        	xtype: 'textfield',
                        	id: 'name',
                        	emptyText: this.layerNameEmptyText,
                        	name: 'name',
                        	fieldLabel: this.layerNameLabelText
                        },
                        {
                            xtype: 'fileuploadfield',
                            fieldClass: 'upload-form-field',
                            id: 'form-file-field',
                            emptyText: this.fileEmptyText,
                            name: 'file',
                            fieldLabel: this.fileLabelText,
                            buttonText: this.chooseFileText

                        }
                    ]
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
    			}
    		]
    	};

    	Ext.apply(me, defaultOptions);



    	Viewer.plugins.ShpWizard.superclass.initComponent.apply(me, arguments);
    },
    navHandler: function (direction) {
        var changePanel = false;
        

        switch(this.step) {
            case 0:
                if(direction > 0) {
                    changePanel = this.uploadFile();
                } else {
                    changePanel = true;
                }

                break;
            case 1:
                var fp = this.items.get(1);
                if (fp.getForm().isValid()) { 
                // Look for repeated names in newName
                    var values = fp.getForm().getValues();
                    var newNames = values.newName;
                    for(var i=0; i < newNames.length - 1; i++) {
                        for (var j = i +1; j < newNames.length; j++) {
                            if (newNames[i] === newNames[j]) {
                                Ext.Msg.alert('Nombres repetidos', 'Hay nombres de campos repetidos. Por favor utilice un nombre único para cada campo.');
                                return;
                            }
                        }

                    }                                 
                    this.layout.setActiveItem(1);
                    fp.getForm().submit(
                    {   
                    	scope: this,
                        url: '../../uploadShp/step2',
                        waitMsg: this.createLayerWaitMsgText,
                        waitTitle: this.createLayerWaitMsgTitleText,
                        success: function(fp, o) {
	                        var resp = Ext.util.JSON.decode(o.response.responseText);
	                        if (resp && resp.success && resp.data && resp.data.status==="success") {
	                        	//Add layer to map and close window
	                            var layerName = resp.data.layerName;
	                            var layerTitle = resp.data.layerTitle;
	                            var geoserverUrl = (resp.data.serverUrl) || (app.sources.local.url + "/wms");
	                            var layer = new OpenLayers.Layer.WMS(layerTitle,
	                            		geoserverUrl,
	                            	{
	                            		layers: layerName,
	                            		transparent: true                         
	                            	}, {
	                            		opacity: 1,
	                            		visibility: true                            					
	                            	});
	                            layer.metadata.layerResourceId = this.layerResourceId;
	                            layer.metadata.layerTypeId = this.layerTypeId;
	                            layer.metadata.temporal = true;
	                            Viewer.getMapPanel().map.addLayer(layer);
	                            this.close();
	                            Ext.Msg.alert('Capa creada', "La capa se ha creado de forma temporal");
	                        } else if(resp && resp.success && resp.data && resp.data.status === "error") {
	                        	Ext.Msg.alert('Error', resp.data.message);
	                        } else {
	                        	Ext.Msg.alert('Error', "Se ha producido un error creando la capa.");
	                        }
	                    },
	                    failure: function(form, action) {
	                    	Ext.Msg.alert('Error', "Se ha producido un error al enviar los datos al servidor");
	                    }
                    });
                } else {
                     Ext.Msg.alert('Valores incorrectos', 
                        'Por favor, introduzca un nombre para campo de la capa.');
                                return;
                }
                break;
            default:
                this.step = 0;
                this.layout.setActiveItem(0);
        }

        if (changePanel) {
            if (direction > 0) {
               this.step = this.step + 1;
            } else {
                this.step = this.step - 1;
            }

        }
    },
    /**
     *   Perfoms the upload. 
     */
    uploadFile: function() {
        var fp = Ext.ComponentMgr.get('uploadShapeForm');
        if (fp.getForm().isValid()) {
            fp.getForm().submit({
                url: '../../uploadShp/step1',
                waitMsg: this.uploadWaitMsgText,
                waitTitle: this.waitTitleMsgText,
                success: function(fp, o) {
                	var resp = Ext.util.JSON.decode(o.response.responseText);
                	
                	if(resp && resp.success && resp.data && resp.data.status === "error") {
                		Ext.Msg.alert('Error', resp.data.message);
                		return false;
                	} else if(!resp || !resp.success || !resp.data){
                		Ext.Msg.alert('Error', "Se ha producido un error creando la capa.");
                		return false;
                	}

                	// read response, populate Grid and show field name edit form.
                	this.layerResourceId = resp.data.layerResourceId;
                	this.layerTypeId = resp.data.layerTypeId;
                    this.initEditableGrid(o);
                    this.layout.setActiveItem(1);
                    this.doLayout();
                    this.step = 1;
                }, 
                failure: function(form, action) {
                	Ext.Msg.alert('Error', "Se ha producido un error al enviar los datos al servidor");
                	return false;
                },
                
                scope: this
            });
        }
    }, 
    initEditableGrid: function (o) {
        


        var resp = Ext.util.JSON.decode(o.response.responseText);
        
        if (resp && resp.success && resp.data) {
            this.store.loadData(resp.data);
            var tableNameField = new Ext.form.Hidden({
                    name: 'tableName',
                    value: resp.data.tableName
                });
            this.items.get(1).add(tableNameField);
            
            var layerNameField = new Ext.form.Hidden({
                name: 'layerName',
                value: resp.data.layerName
            });
        this.items.get(1).add(layerNameField);

            var i = 0;
            while (i < resp.data.columnsMetadata.length){
                var column = resp.data.columnsMetadata[i++];
                var field = new Ext.form.TextField({
                    fieldLabel: column.name,
                    value: column.name,
                    name: 'newName',
                    allowBlank: false
                });
                var hiddenField = new Ext.form.Hidden({
                    name: 'oldName',
                    value: column.name

                });
                this.items.get(1).add(field);
                this.items.get(1).add(hiddenField);
            }


        } else {
            console.log("False");
        }



    }



});

Ext.preg(Viewer.plugins.ShpWizard.prototype.ptype, Viewer.plugins.ShpWizard);
