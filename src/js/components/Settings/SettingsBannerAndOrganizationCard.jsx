import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { renderLog } from '../../utils/logging';
import { startsWith } from '../../utils/textFormat';
import OrganizationCard from '../VoterGuide/OrganizationCard';

export default class SettingsBannerAndOrganizationCard extends Component {
  constructor (props) {
    super(props);
    this.state = {
      organization: {},
    };
  }

  componentDidMount () {
    // console.log("SettingsBannerAndOrganizationCard componentDidMount");
    this.setState({
      organization: this.props.organization,
    });
  }

  // eslint-disable-next-line camelcase,react/sort-comp
  UNSAFE_componentWillReceiveProps (nextProps) {
    // console.log("SettingsBannerAndOrganizationCard componentWillReceiveProps");
    this.setState({
      organization: nextProps.organization,
    });
  }

  render () {
    renderLog('SettingsBannerAndOrganizationCard');  // Set LOG_RENDER_EVENTS to log all renders
    if (!this.state.organization && !this.state.organization.organization_we_vote_id) {
      return null;
    }

    return (
      <div>
        { this.state.organization && this.state.organization.organization_banner_url && this.state.organization.organization_banner_url !== '' ? (
          <div className="organization-banner-image-div">
            <img className="organization-banner-image-img" src={this.state.organization.organization_banner_url} />
          </div>
        ) : null}
        {this.state.organization.organization_name && !startsWith('Voter-', this.state.organization.organization_name) ? (
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-main">
                    <OrganizationCard
                      organization={this.state.organization}
                      turnOffTwitterHandle
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
SettingsBannerAndOrganizationCard.propTypes = {
  organization: PropTypes.object,
};
