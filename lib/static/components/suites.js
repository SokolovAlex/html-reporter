'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import LazilyRender from 'react-lazily-render';

import SectionCommon from './section/section-common';
import clientEvents from '../../gui/constants/client-events';
import {suiteBegin, testBegin, testResult, testsEnd} from '../modules/actions';
import {shouldSuiteBeShownByName, shouldSuiteBeShownByBrowser} from '../modules/utils';

class Suites extends Component {
    static propTypes = {
        suiteIds: PropTypes.arrayOf(PropTypes.string),
        gui: PropTypes.bool
    }

    componentDidMount() {
        this.props.gui && this._subscribeToEvents();
    }

    _subscribeToEvents() {
        const {actions} = this.props;
        const eventSource = new EventSource('/events');
        eventSource.addEventListener(clientEvents.BEGIN_SUITE, (e) => {
            const data = JSON.parse(e.data);
            actions.suiteBegin(data);
        });

        eventSource.addEventListener(clientEvents.BEGIN_STATE, (e) => {
            const data = JSON.parse(e.data);
            actions.testBegin(data);
        });

        [clientEvents.TEST_RESULT, clientEvents.ERROR].forEach((eventName) => {
            eventSource.addEventListener(eventName, (e) => {
                const data = JSON.parse(e.data);
                actions.testResult(data);
            });
        });

        eventSource.addEventListener(clientEvents.END, () => {
            this.props.actions.testsEnd();
        });
    }

    render() {
        const {suiteIds, filterByName, filteredBrowsers} = this.props;

        return (
            <div className="sections">
                {suiteIds.map((suiteId) => {
                    const sectionElem = <SectionCommon suiteId={suiteId} filterByName={filterByName} filteredBrowsers={filteredBrowsers}/>;

                    return <LazilyRender key={suiteId} offset={1000} content={sectionElem} />;
                })}
            </div>
        );
    }
}

const actions = {testBegin, suiteBegin, testResult, testsEnd};

export default connect(
    (state) => {
        const {filterByName, filteredBrowsers} = state.view;
        let suiteIds = state.suiteIds[state.view.viewMode];

        if (filteredBrowsers.length > 0) {
            suiteIds = suiteIds.filter(id => shouldSuiteBeShownByBrowser(state.suites[id], filteredBrowsers));
        }

        if (filterByName) {
            suiteIds = suiteIds.filter(id => shouldSuiteBeShownByName(state.suites[id], filterByName));
        }

        return ({
            suiteIds,
            gui: state.gui,
            filterByName,
            filteredBrowsers
        });
    },
    (dispatch) => ({actions: bindActionCreators(actions, dispatch)})
)(Suites);
