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
 */
 
Ext.override(Ext.Element, {
    alignMiddle: function(parent) {
        if (Ext.isString(parent)) {
            parent = Ext.get(parent) || this.up(parent);
        }
        this.setStyle({
            'margin-top': (parent.getHeight() / 2 - this.getHeight() / 2) + 'px'
        });
    }
});
 
Ext.override(Ext.ProgressBar, {
    setSize: Ext.ProgressBar.superclass.setSize,
    onResize: function(w, h) {
        var inner = Ext.get(this.el.child('.x-progress-inner')),
            bar = inner.child('.x-progress-bar'),
            pt = inner.child('.x-progress-text');
            ptInner = pt.child('*');
            ptb = inner.child('.x-progress-text-back'),
            ptbInner = ptb.child('*');
        Ext.ProgressBar.superclass.onResize.apply(this, arguments);
        inner.setHeight(h);
        bar.setHeight(h);
        this.textEl.setHeight('auto');
        pt.setHeight('auto');
        ptb.setHeight('auto');
        ptInner.alignMiddle(bar);
        ptbInner.alignMiddle(bar);
        this.syncProgressBar();
    }
});

Ext.namespace("Viewer.dialog");

Viewer.dialog.WfsWizard = Ext.extend(Ext.Window, {
    xtype: "vw_wfswizard",
   	height: 400,
   	width: 800,
   	layout: {
        type: 'card'
    },
   	title: 'Asistente WFS',
    returnProjection: Viewer.GEO_PROJECTION,
   	activeItem: 0,
       
    initComponent: function() {
       var me = this;
       this.self = me;
        Ext.applyIf(me, {
           items: [
               {
                   xtype: 'form',
                   itemId: 'step-1',
                   padding: 10,
                   title: 'Datos del servicio',
                   waitTitle: 'Por favor espere...',
                   items: [
                       {
                          xtype: 'label',
                          text: 'La presente ventana le permite añadir una nueva capa de tipo WFS al visor. '
                               + 'Introduza a continuación la URL del documento Capabilities del servicio que desee añadir. '
                               + 'En el paso siguiente podrá seleccionar que tipo de elemento de los ofrecidos por el servicio '
                               + 'desea añadir al visor.',
                          style: "display:block; padding-bottom: 10px"
                       },
                       {
                           xtype: 'textfield',
                           anchor: '100%',
                           fieldLabel: 'URL',
                           itemId: 'urlTextField',
                           allowBlank: false,
                           blankText: 'Introduzca la URL del servicio WFS',
                           vtype: 'url',
                           vtypeText: 'Este campo debe ser una URL en formato "http://www.ejemplo.com/service/wfs?request=GetCapabilities"',
                           msgTarget: 'under'
                       }
                    ],
                    buttons: [
                       {
                           xtype: 'button',
                           text: 'Siguiente',
                           listeners: {
                               click: {
                                   fn: me.nextClicked,
                                   scope: me
                               }
                           }
                       }
                   ]
               },
               {
                   xtype: 'panel',
                   itemId: 'step-2',
                   header:false,
                   height: 171,
                   layout : {
                        type  : 'hbox',
                        pack  : 'center',
                        align : 'middle'
                    },
                    items: [{
                       xtype: 'progress',
                       itemId: 'progressBar',
                       text: 'Obteniendo datos del servicio...',
                       width: 300,
                       height:20 
                    }]
                   
               }
           ],
           listeners: {
               featureTypeAdded: function(record) {
                  
               }, 
               beforeDestroy: me.purgeAuxiliarWindows
            }, 
           describeWindows: new Ext.util.MixedCollection()
        });
        Viewer.dialog.WfsWizard.superclass.initComponent.apply(this, arguments);
       this.addEvents(
           /**
            * @event featureTypeAdded
             * Fires after button Add on the grid is clicked.
            * @Param {Ext.data.Record} record The record of the row clicked.
            */
           'featureTypeAdded'
       );
    },
    nextClicked: function(button, e, options) {
        var form = this.items.get('step-1').getForm();
        var url = form.findField('urlTextField').getValue();

        var versionIdx = url.indexOf("version=");

        if(versionIdx===-1) {
          versionIdx = url.indexOf("Version=");
        }        

        if(versionIdx===-1) {
          url+="&Version=1.1.0";
        }

        if (form.isValid()) {
    	   this.progressBar = this.items.get('step-2').getComponent('progressBar');
            this.layout.setActiveItem('step-2');
            this.progressBar.wait();
            OpenLayers.Request.GET({
                url: url,
                callback: this.remoteCapabilitiesLoaded,
                scope: this
            });
        }
    },
    remoteCapabilitiesLoaded: function(request) {
        this.wfsCapabilitiesStore = new GeoExt.data.WFSCapabilitiesStore({
          returnProjection: this.returnProjection
        });
            this.progressBar.updateProgress(100);

            var xmlContent = request.responseXML;
            if(!xmlContent) {
              xmlContent = request.responseText;
            }


            if (request.status == 200) {
                try {
                    this.wfsCapabilitiesStore.on('load', this.wfsLoaded, this);
                    this.wfsCapabilitiesStore.loadData(xmlContent);
                } catch (e) {
                    Ext.Msg.alert("Error recuperando WFSCapabilities", "Se ha producido un error al recuperar "
                    + "la información de las capas disponibles en el servidor. Compruebe que la URL introducida es correcta.");
                    this.layout.setActiveItem('step-1');
                }
            } else {
                Ext.Msg.alert("Error recuperando WFSCapabilities", "Se ha producido un error al recuperar "
                    + "la información de las capas disponibles en el servidor. Compruebe que la URL introducida es correcta.");
                this.layout.setActiveItem('step-1');
            }
    },

    wfsLoaded: function(store, records, options) {     
        this.store = store;

        // Add gridPanel to window
        var grid = new Ext.grid.GridPanel({
            itemId: 'step-3',
            title: "Tipos de elementos disponibles",
            store: this.store,
            columns: [
                {
                    header: "Titulo", dataIndex: "title", sortable: true, width: 250
                },
                {
                    header: "Nombre", dataIndex: "name", sortable: true
                },
                {
                    header: "Espacio de nombre", dataIndex: "namespace", sortable: true, width: 175
                },
                {
                    id: "description", header: "Descripción", dataIndex: "abstract"
                },
                {
                    header: 'Añadir',
                    id: 'anadir',
                    align: 'center',
                    renderer: function(value, meta, record, rowIndex) {
                        //return '<div class="vw-add-grid-button">Añadir</div>';
                        meta.css = 'add-button';
                        return '';
                    },
                    width: 50
                }, 
                {
                    header: 'Campos',
                    id: 'verCampos',
                    align: 'center',
                    renderer: function(value, meta, record, rowIndex) {
                        //return '<div class="vw-viewdata-grid-button">Ver campos</div>';
                        meta.css = 'info-button';
                        return '';

                    },
                    width: 50

                }
            ],
            sm: new Ext.grid.RowSelectionModel({singleSelect: true}),
            flex: 1,
            frame: false,
            iconCls: 'icon-grid',
            listeners: {
                cellclick: this.onLayerClicked,
                scope: this
            }
        });

        this.add(grid);
        this.layout.setActiveItem('step-3');
    },

    /**
    * Called when Add button in the grid is clicked. 
    */
    onLayerClicked: function(grid, rowIndex, columnIndex, evt) {
        // Column anadir
        if(columnIndex == 4) {
            var record = grid.getStore().getAt(rowIndex);
            this.fireEvent('featureTypeAdded', record);
            Ext.Msg.alert("Capa añadida", "Se ha añadido la capa " + record.data.name + " al visor");
        } else if (columnIndex == 5) { // column view fields
            var record = grid.getStore().getAt(rowIndex);
            this.loadDescribeFeature(record);
        }
    },
    loadDescribeFeature: function(record) {
        var dw = this.describeWindows.get(record.data.namespace + record.data.name);
        if (!dw) {
            OpenLayers.Request.GET({
                url: record.data.layer.protocol.url,
                params: {
                    "SERVICE": "WFS",
                    "REQUEST": "DescribeFeatureType",
                    "VERSION": record.data.layer.protocol.version,
                    "TYPENAME": record.data.layer.protocol.featureType
                },
                callback: this.describeFeatureTypeLoaded,
                scope: {
                    self_: this, 
                    name: record.data.name, 
                    namespace: record.data.namespace
                }
            });
        } else {
            dw.show();
        }
    },
    describeFeatureTypeLoaded: function(request) {
        if (request.status == 200) {
                try {
                    var attributeStore = new GeoExt.data.AttributeStore();;
                    attributeStore.loadData(request.responseXML);
                    var dfWindow = new Ext.Window({
                        title: 'Campos de la capa "' + this.name + '"',
                        layout: 'fit',
                        closeAction: 'hide',
                        height: 250,
                        width: 400,
                        items: [
                            {
                                xtype: 'grid',
                                store: attributeStore,
                                columns: [
                                    {
                                         header: "Nombre", dataIndex: "name", sortable: true
                                    },
                                    {
                                         header: "Tipo", dataIndex: "type", sortable: true
                                    },
                                    {
                                         header: "Opcional", dataIndex: "nillable", sortable: true
                                    }
                                ]
                            }
                        ]
                    });
                    this.self_.describeWindows.add(this.namespace+this.name, dfWindow);
                    dfWindow.show();
                } catch (e) {
                    Ext.Msg.alert("Error recuperando campos de la capa", "Se ha producido un error al recuperar "
                    + "la información de los campos de la capa.");
                }
            } else {
                Ext.Msg.alert("Error recuperando campos de la capa", "Se ha producido un error al recuperar "
                    + "la información de los campos de la capa.");
                
            }


    },
    purgeAuxiliarWindows: function() {
        var i = this.describeWindows.each(function(item) {
            item.close();

        });
    }
});
