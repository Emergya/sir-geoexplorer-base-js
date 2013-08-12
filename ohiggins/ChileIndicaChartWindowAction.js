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
 * Author: Daniel Pavon Perez <dpavon@emergya.com>
 */

/**
 * @requires plugins/Tool.js
 */

Ext.ux.WindowAlwaysOnTop = function() {
    this.init = function(win) {
        win.on('deactivate', function() {
            var i = 1;
            this.manager.each(function() {
                i++;
            });
            this.setZIndex(this.manager.zseed + (i * 10));
        });
    };
};


/*
 * @ptype pgeo_chileindicainvestmentchart
 * api: (define)
 * module = gxp
 * class = ChileIndicaChartWindow
 * base_link = `gxp.plugins.Tool`_
 */
Ext.ns("Viewer.plugins");

Viewer.plugins.ChileIndicaChartWindowAction = Ext.extend(gxp.plugins.Tool, {
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "pgeo_chileindicainvestmentchart",

    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
    buttonText: 'Iniciativas de Inversión',

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: 'Open the window that shows the investment initiatives',

    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-investmet-initiatives',

    /** private: method[constructor]
     */
    constructor: function (config) {
        Viewer.plugins.ChileIndicaChartWindowAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function (target) {
        Viewer.plugins.ChileIndicaChartWindowAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    addActions: function () {
        return Viewer.plugins.ChileIndicaChartWindowAction.superclass.addActions.apply(this, [
            {
                buttonText: this.showButtonText ? this.buttonText : '',
                menuText: this.menuText,
                iconCls: this.iconCls,
                tooltip: this.tooltip,
                handler: function () {
                    var ds = Viewer.getComponent('ChileIndicaChartWindow');
                    if (ds === undefined) {
                        var mapPanel = Viewer.getMapPanel();
//                        var onTop = new Ext.WindowGroup;
//                        onTop.zseed = 10000;
                        ds = new Viewer.dialog.ChileIndicaChartWindow({
                            mapPanel: mapPanel,
                            map: mapPanel.map//,
                            //manager: onTop
                            //plugins: new Ext.ux.WindowAlwaysOnTop
                        });
                        Viewer.registerComponent('ChileIndicaChartWindow', ds);
                    }
                    if (ds.isVisible()) {
                        ds.hide();
                    } else {
                        Viewer.trackUrl('modules/Iniciativas_de_inversion');
                        ds.show();
                        //ds.alignTo(app.mapPanelContainer.ownerCt.el,"bl-bl");
                    }


                },
                scope: this
            }
        ]);
    }

});


Ext.preg(Viewer.plugins.ChileIndicaChartWindowAction.prototype.ptype, Viewer.plugins.ChileIndicaChartWindowAction);

