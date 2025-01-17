import { Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ArrowBack, ArrowBackIos } from '@material-ui/icons';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { historyPush, isIOS } from '../../utils/cordovaUtils';
import { renderLog } from '../../utils/logging';
import { shortenText } from '../../utils/textFormat';


const styles = {
  root: {
    outline: 'none !important',
    '& span': {
      textTransform: 'none',
      fontSize: '18px',
      fontWeight: 'bold',
    },
  },
};

class HeaderBackToButton extends Component {
  render () {
    renderLog('HeaderBackToButton');  // Set LOG_RENDER_EVENTS to log all renders
    const { classes, className, backToLink, backToLinkText } = this.props;

    return (
      <Button
        variant="text"
        color="primary"
        classes={{ root: classes.root }}
        className={`page-header__backToButton ${className}`}
        id="backToLinkTabHeader"
        onClick={() => historyPush(backToLink)}
      >
        {isIOS() ? (
          <ArrowBackIos className="button-icon" />
        ) : (
          <ArrowBack className="button-icon" />
        )}
        <span className="u-show-desktop-tablet u-no-break">{shortenText(backToLinkText, 60)}</span>
        <span className="u-show-mobile-bigger-than-iphone5 u-no-break">{shortenText(backToLinkText, 23)}</span>
        <span className="u-show-mobile-iphone5-or-smaller u-no-break">{shortenText(backToLinkText, 18)}</span>
      </Button>
    );
  }
}
HeaderBackToButton.propTypes = {
  backToLink: PropTypes.string.isRequired,
  backToLinkText: PropTypes.string,
  className: PropTypes.string,
  classes: PropTypes.object,
};

export default withStyles(styles)(HeaderBackToButton);
