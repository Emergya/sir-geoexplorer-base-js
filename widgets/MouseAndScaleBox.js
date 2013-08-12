/**
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
 * this library; if not, write to the Free Software Foundation, Inc., this.leftPadding1
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Juan Luis Rodriguez Ponce <jlrodriguez@emergya.com>
 */


/**
 * @requires OpenLayers/Control/ScaleLine.js
 * @requires GeoExt/data/ScaleStore.js
 * @requires OpenLayers/Control/CustomMousePosition.js
 */

/** api: (define)
 *  module = Viewer.widgets
 *  class = MouseAndScaleBox
 *  base_link = `Ext.Window <http://dev.sencha.com/deploy/dev/docs/?class=Ext.Window>`_
 */
Ext.namespace("Viewer.widgets");

/** api: constructor
 *  .. class:: ScaleOverlay(config)
 *   
 *      Create a panel for showing a ScaleLine control and a combobox for 
 *      selecting the map scale.
 */
Viewer.widgets.MouseAndScaleBox = Ext.extend(Ext.Window, {

    /** api: ptype = vw_mouseandscalebox */
    ptype: "vw_mouseandscalebox",
    bodyCssClass: 'vw_mouseandscalebox',
    width: 250,
    height: 210,
    x: 5,
    leftPadding: 15, // Why 15? I don't know but it positions it ok.
 //   floating:true,
    frame: true,
    resizable: false,
    draggable: false,
    closable: false,
    minimizable: true,
    minimized: false,
    olControlCustomMousePosition: 'relative',
    headerCfg: {
        cls: 'x-window-header mouseAndScaleBox'
    },
    /** api: config[displayProjection]
     * ``OpenLayers.Projection``
     *  The first projection of the showed coordinates
     */
    displayProjection: new OpenLayers.Projection("EPSG:4326"),
    /** api: config[utmDisplayProjection]
     * ``OpenLayers.Projection``
     *  The second projection of the showed coordinates
     */
    utmDisplayProjection: new OpenLayers.Projection("EPSG:32719"),



    /** api: config[map]
     *  ``OpenLayers.Map`` or :class:`GeoExt.MapPanel`
     *  The map for which to show the scale info.
     */
    map: null,

    /** i18n */
    zoomLevelText: "Zoom level",

    /** private: method[initComponent]
     *  Initialize the component.
     */
    initComponent: function () {
        Viewer.widgets.MouseAndScaleBox.superclass.initComponent.call(this);
        this.cls = 'map-overlay';
        if (this.map) {
            if (this.map instanceof GeoExt.MapPanel) {
                this.map = this.map.map;
            }
            this.bind(this.map);
        }
        this.on("beforedestroy", this.unbind, this);
        this.on("minimize", this.handleMinimize, this);
    },
    
    /** private: method[addToMapPanel]
     *  :param panel: :class:`GeoExt.MapPanel`
     *  
     *  Called by a MapPanel if this component is one of the items in the panel.
     */
    addToMapPanel: function (panel) {
        this.on({
            afterrender: function () {
                this.bind(panel.map);
            },
            scope: this
        });
        panel.on({resize: function () {
            //this.setPosition(this.x, panel.getHeight() - this.height - this.height/3);
            if (this.minimized) {
                
                this.anchorTo(Viewer.getMapPanel().body, 'bl', [this.leftPadding, -30]);
            } else {
                this.anchorTo(Viewer.getMapPanel().body, 'bl', [this.leftPadding, -this.height]);
            }
            
            },
            scope: this
        });
    },
    
    /** private: method[stopMouseEvents]
     *  :param e: ``Object``
     */
    stopMouseEvents: function (e) {
        e.stopEvent();
    },
    
    /** private: method[removeFromMapPanel]
     *  :param panel: :class:`GeoExt.MapPanel`
     *  
     *  Called by a MapPanel if this component is one of the items in the panel.
     */
    removeFromMapPanel: function (panel) {
        var el = this.getEl();
        el.un("mousedown", this.stopMouseEvents, this);
        el.un("click", this.stopMouseEvents, this);
        this.unbind();
    },

    /** private: method[addScaleLine]
     *  
     *  Create the scale line control and add it to the panel.
     */
    addScaleLine: function () {
        var scaleLinePanel = new Ext.BoxComponent({
            autoEl: {
                tag: "div",
                cls: "olControlScaleLine overlay-element overlay-scaleline"
            }
        });
        this.on("afterlayout", function () {
            scaleLinePanel.getEl().dom.style.position = 'relative';
            scaleLinePanel.getEl().dom.style.display = 'inline';

            this.getEl().on("click", this.stopMouseEvents, this);
            this.getEl().on("mousedown", this.stopMouseEvents, this);
        }, this);
        scaleLinePanel.on('render', function () {
            var scaleLine = new OpenLayers.Control.ScaleLine({
                geodesic: true,
                div: scaleLinePanel.getEl().dom
            });

            this.map.addControl(scaleLine);
            scaleLine.activate();
        }, this);
        this.add(scaleLinePanel);
    },

    /** private: method[handleZoomEnd]
     *
     * Set the correct value in the scale combo box.
     */
    handleZoomEnd: function () {
        var scale = this.zoomStore.queryBy(function (record) { 
            return this.map.getZoom() == record.data.level;
        }, this);
        if (scale.length > 0) {
            scale = scale.items[0];
            this.zoomSelector.setValue("1 : " + Ext.util.Format.number(parseInt(scale.data.scale, 10),"0.000.000/i"));
        } else {
            if (!this.zoomSelector.rendered) {
                return;
            }
            this.zoomSelector.clearValue();
        }
    },

    /** private: method[addScaleCombo]
     *  
     *  Create the scale combo and add it to the panel.
     */
    addScaleCombo: function () {
        this.zoomStore = new GeoExt.data.ScaleStore({
            map: this.map
        });

        this.zoomSelector = new Ext.form.ComboBox({
            emptyText: this.zoomLevelText,
            tpl: '<tpl for="."><div class="x-combo-list-item">1 : {[Ext.util.Format.number(values.scale,"0.000.000/i")]}</div></tpl>',
            editable: false,
            hiddenName: "zoomLevelControl",
            triggerAction: 'all',
            mode: 'local',
            store: this.zoomStore,
            width: 110
        });
        this.zoomSelector.on({
            click: this.stopMouseEvents,
            mousedown: this.stopMouseEvents,
            select: function (combo, record, index) {
                this.map.zoomTo(record.data.level);
            },
            scope: this
        });
        this.map.events.register('zoomend', this, this.handleZoomEnd);
        var zoomSelectorWrapper = new Ext.Panel({
            items: [this.zoomSelector],
            cls: 'overlay-element overlay-scalechooser',
            border: false
        });
        this.add(zoomSelectorWrapper);
    },

    /** private: method[addMousePosition]
     *  
     *  Create the mouse position control and add it to the panel.
     */
    addMousePosition: function () {
        var mousePositionPanel = new Ext.BoxComponent({
            autoEl: {
                tag: "div",
                cls: "olControlCustomMousePosition"
            }
        });
        this.on("afterlayout", function () {
            mousePositionPanel.getEl().dom.style.position = this.olControlCustomMousePosition;
            mousePositionPanel.getEl().dom.style.display = 'inline';

            this.getEl().on("click", this.stopMouseEvents, this);
            this.getEl().on("mousedown", this.stopMouseEvents, this);
        }, this);
        mousePositionPanel.on('render', function () {
            var mousePosition = new OpenLayers.Control.CustomMousePosition({
                geodesic: true,
                div: mousePositionPanel.getEl().dom,
                displayProjection: this.displayProjection,
                utmDisplayProjection: this.utmDisplayProjection,
                emptyString: null
            });

            this.map.addControl(mousePosition);
            mousePosition.activate();
        }, this);
        this.add(mousePositionPanel);
    },

    /** private: method[bind]
     *  :param map: ``OpenLayers.Map``
     */
    bind: function (map) {
        this.map = map;
        this.addMousePosition();
        this.addScaleCombo();
        this.addScaleLine();

        this.doLayout();
        this.show();
        //this.setPosition(100,100);
    },
    
    /** private: method[unbind]
     */
    unbind: function () {
        if (this.map && this.map.events) {
            this.map.events.unregister('zoomend', this, this.handleZoomEnd);
        }
        this.zoomStore = null;
        this.zoomSelector = null;
    },

    handleMinimize: function () {
        var title = this.minimizedTitle || this.title;
        this.toggleCollapse(false);
        if (!this.minimized) {
            this.minimized = true;
            this.anchorTo(Viewer.getMapPanel().body, 'bl', [this.leftPadding, -30]);
            this.setTitle("Coordenadas y Escala");
        } else {
            this.setTitle(null);
            this.minimized = false;
            this.anchorTo(Viewer.getMapPanel().body, 'bl', [this.leftPadding, -this.height]);
        }
    }

});

/** api: xtype = vw_mouseandscalebox */
Ext.reg(Viewer.widgets.MouseAndScaleBox.prototype.ptype, Viewer.widgets.MouseAndScaleBox);
