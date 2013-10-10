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
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */

Viewer.widgets.StoredSearchesToolbar = Ext.extend(Ext.Toolbar, {

    source: null,
    url: null,

    constructor: function(config) {

        Ext.apply(this, config);

        this.tools = [];

        Viewer.widgets.StoredSearchesToolbar.superclass.constructor.call(this, Ext.apply({
            id: 'storedsearchestbar',
            cls: 'viewer_storedsearchestoolbar'
        }, config));
    }, 

    initComponent: function(){

        // obtain default source: local
        if(!this.source){
            this.source = this.target.sources.local;
        }
        // obtain default url: source(local).url
        if(!this.url 
            && !!this.source){
            this.url = this.source.url.replace('ows', 'wfs');
        }

        this.plugins = [{
            ptype: 'viewer_storedSearchAction',
            tooltip: 'Proyectos de generación aprobados en SEIA por ámbito',
            controller: 'ProyectosSEAStoredSearch',
            actionTarget: 'storedsearchestbar',
            iconCls: 'vw-icon-ProyectosSEAStoredSearch',
            target: this.target,
            source: this.source, 
            featureManager:this.featureManager,
            featureGrid:this.featureGrid,
            wfsServiceUrl: this.url 
        }, {
            ptype: 'viewer_storedSearchAction',
            tooltip: 'Proyectos de generación aprobados por tipo de combustible y potencia',
            controller: 'ProyectosSEACombustiblePotenciaStoredSearch',
            actionTarget: 'storedsearchestbar',
            iconCls: 'vw-icon-ProyectosSEACombustiblePotenciaStoredSearch',
            target: this.target,
            source: this.source, 
            featureManager:this.featureManager,
            featureGrid:this.featureGrid,
            wfsServiceUrl: this.url 
        }, {
            ptype: 'viewer_storedSearchAction',
            tooltip: 'Centrales generadoras por tipo de combustible',
            controller: 'CentralesCombustibleStoredSearch',
            actionTarget: 'storedsearchestbar',
            iconCls: 'vw-icon-CentralesCombustibleStoredSearch',
            target: this.target,
            source: this.source, 
            featureManager:this.featureManager,
            featureGrid:this.featureGrid,
            wfsServiceUrl: this.url 
        }, {
            ptype: 'viewer_storedSearchAction',
            tooltip: 'Centrales generadoras por tipo',
            controller: 'CentralesTipoStoredSearch',
            actionTarget: 'storedsearchestbar',
            iconCls: 'vw-icon-CentralesTipoStoredSearch',
            target: this.target,
            source: this.source, 
            featureManager:this.featureManager,
            featureGrid:this.featureGrid,
            wfsServiceUrl: this.url 
        }, {
            ptype: 'viewer_storedSearchAction',
            tooltip: 'Centrales generadoras por ámbito territorial',
            controller: 'CentralesAmbitoStoredSearch',
            actionTarget: 'storedsearchestbar',
            iconCls: 'vw-icon-CentralesAmbitoStoredSearch',
            target: this.target,
            source: this.source, 
            featureManager:this.featureManager,
            featureGrid:this.featureGrid,
            wfsServiceUrl: this.url 
        }, {
            ptype: 'viewer_storedSearchAction',
            tooltip: 'Centrales generadoras por potencia',
            controller: 'CentralesPotenciaStoredSearch',
            actionTarget: 'storedsearchestbar',
            iconCls: 'vw-icon-CentralesPotenciaStoredSearch',
            target: this.target,
            source: this.source, 
            featureManager:this.featureManager,
            featureGrid:this.featureGrid,
            wfsServiceUrl: this.url 
        }];
        
        Viewer.widgets.StoredSearchesToolbar.superclass.initComponent.call(this, arguments);
    }

});

Ext.reg('viewer_storedsearchestoolbar', Viewer.widgets.StoredSearchesToolbar);
