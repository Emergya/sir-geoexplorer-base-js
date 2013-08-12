/*
 * KMLWizard.js
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
 * Authors:: Antonio José Rodríguez Ríos (mailto:ajrodriguez@emergya.com)
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
 *  class = KMLWizard
 *  base_link = `Ext.Window <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Window>`
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: KMLWizard(config)
 *
 *    Upload KMLfiles wizard.
 */
Viewer.plugins.KMLWizard = Ext.extend(Ext.Window, {
	/** api: ptype = vw_kmlwizard */
    ptype: "vw_kmlwizard",
    step: 0,

    /** i18n **/
    windowTitleText: "New Layer from KML",
    fileEmptyText: "Select a KML",
    layerNameEmptyText: "Type a name for the layer",
    buttonNextText: "Next",
    layerNameLabelText: "Layer's Name",
    fileLabelText: "KML File",
    chooseFileText: "Explore...",
    waitTitleMsgText: "File upload",
    createLayerWaitMsgText: "Creating Layer from KML file. Please wait.",
    createLayerWaitMsgTitleText: "Processing KML",
    fieldNameEmptyText: 'Type a name for the field (letters, numbers and _)',
    layerTypeId: null,
    layerResourceId: null,
    descriptionTextKML: 'Enter the name for the new layer and select a KML file to upload.',
    
    initComponent: function() {
    	var me = this;
    	this.self = me;

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
                    id: 'uploadKmlForm',
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
						    xtype: 'label',
						    cls: 'toolDescription',
						    text: this.descriptionTextKML
						}, 
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
    			},{
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

    	Viewer.plugins.KMLWizard.superclass.initComponent.apply(me, arguments);
    },
    navHandler: function (direction) {

        switch(this.step) {
            case 0:
            	if(direction > 0) {
                    changePanel = this.showColumnSelector();
            	}
            	break;
            
            default:
                this.step = 0;
                this.layout.setActiveItem(0);
        }

    },

    showColumnSelector: function() {
    	var fp = Ext.ComponentMgr.get('uploadKmlForm');
    	if (fp.getForm().isValid()) {
            fp.getForm().submit({
            	scope: this,
                url: '../../uploadKml/step1',
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
                        layer.metadata.layerResourceId = resp.data.layerResourceId;
                        layer.metadata.layerTypeId = resp.data.layerTypeId;
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
                },
                
                scope: this
            });
        }
    }


});

Ext.preg(Viewer.plugins.KMLWizard.prototype.ptype, Viewer.plugins.KMLWizard);
