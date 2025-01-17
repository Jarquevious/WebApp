import { Tabs, Tab } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';
import ActivityActions from '../../actions/ActivityActions';
import AnalyticsActions from '../../actions/AnalyticsActions';
import FriendActions from '../../actions/FriendActions';
import LoadingWheel from '../../components/LoadingWheel';
import AppStore from '../../stores/AppStore';
import FriendStore from '../../stores/FriendStore';
import VoterStore from '../../stores/VoterStore';
import { cordovaBallotFilterTopMargin, cordovaFriendsWrapper } from '../../utils/cordovaOffsets';
import { cordovaDot, historyPush, isCordova, isWebApp } from '../../utils/cordovaUtils';
import displayFriendsTabs from '../../utils/displayFriendsTabs';
import sortFriendListByMutualFriends from '../../utils/friendFunctions';
import isMobileScreenSize from '../../utils/isMobileScreenSize';
import { renderLog } from '../../utils/logging';
import AddFriendsByEmail from '../../components/Friends/AddFriendsByEmail';
import BrowserPushMessage from '../../components/Widgets/BrowserPushMessage';
import FacebookSignInCard from '../../components/Facebook/FacebookSignInCard';
import FriendInvitationsSentByMe from './FriendInvitationsSentByMe';
import FriendInvitationsSentByMePreview from '../../components/Friends/FriendInvitationsSentByMePreview';
import FriendInvitationsSentToMe from './FriendInvitationsSentToMe';
import FriendInvitationsSentToMePreview from '../../components/Friends/FriendInvitationsSentToMePreview';
import FriendsCurrent from './FriendsCurrent';
import FriendsCurrentPreview from '../../components/Friends/FriendsCurrentPreview';
import FriendsPromoBox from '../../components/Friends/FriendsPromoBox';
import InviteByEmail from './InviteByEmail';
import MessageCard from '../../components/Widgets/MessageCard';
import SuggestedFriends from './SuggestedFriends';
import SuggestedFriendsPreview from '../../components/Friends/SuggestedFriendsPreview';
import TwitterSignInCard from '../../components/Twitter/TwitterSignInCard';
import TooltipIcon from '../../components/Widgets/TooltipIcon';
import testimonialImage from '../../../img/global/photos/Dale_McGrew-200x200.jpg';

const FirstAndLastNameRequiredAlert = React.lazy(() => import(/* webpackChunkName: 'FirstAndLastNameRequiredAlert' */ '../../components/Widgets/FirstAndLastNameRequiredAlert'));

const testimonialAuthor = 'Dale M., Oakland, California';
const imageUrl = cordovaDot(testimonialImage);
const testimonial = 'Instead of searching through emails and social media for recommendations, I can see how my friends are voting on We Vote.';

class Friends extends Component {
  static getDerivedStateFromProps (props, state) {
    const { defaultTabItem } = state;
    const { match: { params: { tabItem } } } = props;
    // console.log('Friends getDerivedStateFromProps defaultTabItem:', defaultTabItem, ', tabItem:', tabItem);
    // We only redirect when in mobile mode (when "displayFriendsTabs()" is true), a tab param has not been passed in, and we have a defaultTab specified
    // This solves an edge case where you re-click the Friends Footer tab when you are in the friends section
    if (displayFriendsTabs() && tabItem === undefined && defaultTabItem && defaultTabItem.length) {
      historyPush(`/friends/${defaultTabItem}`);
    }
    return null;
  }

  constructor (props) {
    super(props);
    this.state = {
      currentFriendList: [],
      defaultTabItem: '',
      friendActivityExists: false,
      friendInvitationsSentByMe: [],
      friendInvitationsSentToMe: [],
      friendsHeaderUnpinned: false,
      suggestedFriendList: [],
      voterIsSignedIn: false,
    };
  }

  componentDidMount () {
    // console.log('Friends componentDidMount');
    this.appStoreListener = AppStore.addListener(this.onAppStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    this.friendStoreListener = FriendStore.addListener(this.onFriendStoreChange.bind(this));
    FriendActions.currentFriends();
    FriendActions.friendInvitationsSentToMe();
    FriendActions.friendInvitationsSentByMe();
    FriendActions.suggestedFriendList();
    const friendInvitationsSentByMe = FriendStore.friendInvitationsSentByMe();
    const friendInvitationsSentToMe = FriendStore.friendInvitationsSentToMe();
    const suggestedFriendListUnsorted = FriendStore.suggestedFriendList();
    const suggestedFriendList = sortFriendListByMutualFriends(suggestedFriendListUnsorted);
    const voter = VoterStore.getVoter();
    let voterIsSignedIn = false;
    if (voter && voter.is_signed_in) {
      voterIsSignedIn = voter.is_signed_in;
    }

    const currentFriendListUnsorted = FriendStore.currentFriends();
    const currentFriendList = sortFriendListByMutualFriends(currentFriendListUnsorted);
    this.setState({
      currentFriendList,
      friendInvitationsSentToMe,
      friendInvitationsSentByMe,
      suggestedFriendList,
      voter,
      voterIsSignedIn,
    });
    this.resetDefaultTabForMobile(friendInvitationsSentToMe, suggestedFriendList, friendInvitationsSentByMe);
    ActivityActions.activityNoticeListRetrieve();
    AnalyticsActions.saveActionNetwork(VoterStore.electionId());
  }

  componentWillUnmount () {
    this.voterStoreListener.remove();
    this.friendStoreListener.remove();
    this.appStoreListener.remove();
  }

  onVoterStoreChange () {
    const voter = VoterStore.getVoter();
    let voterIsSignedIn = false;
    if (voter && voter.is_signed_in) {
      voterIsSignedIn = voter.is_signed_in;
    }
    this.setState({
      voter,
      voterIsSignedIn,
    });
  }

  onFriendStoreChange () {
    let {
      currentFriendList,
      friendInvitationsSentByMe, friendInvitationsSentToMe, suggestedFriendList,
    } = this.state;
    let resetDefaultTab = false;
    if (currentFriendList && currentFriendList.length !== FriendStore.currentFriends().length) {
      const currentFriendListUnsorted = FriendStore.currentFriends();
      currentFriendList = sortFriendListByMutualFriends(currentFriendListUnsorted);
      this.setState({ currentFriendList });
      // console.log('currentFriendList has changed, currentFriendList:', currentFriendList);
    }
    if (friendInvitationsSentByMe && friendInvitationsSentByMe.length !== FriendStore.friendInvitationsSentByMe().length) {
      friendInvitationsSentByMe = FriendStore.friendInvitationsSentByMe();
      this.setState({ friendInvitationsSentByMe });
      // console.log('friendInvitationsSentByMe has changed, friendInvitationsSentByMe:', friendInvitationsSentByMe);
      resetDefaultTab = true;
    }
    if (friendInvitationsSentToMe && friendInvitationsSentToMe.length !== FriendStore.friendInvitationsSentToMe().length) {
      friendInvitationsSentToMe = FriendStore.friendInvitationsSentToMe();
      this.setState({ friendInvitationsSentToMe });
      // console.log('friendInvitationsSentToMe has changed, friendInvitationsSentToMe:', friendInvitationsSentToMe);
      resetDefaultTab = true;
    }
    if (suggestedFriendList && suggestedFriendList.length !== FriendStore.suggestedFriendList().length) {
      const suggestedFriendListUnsorted = FriendStore.suggestedFriendList();
      suggestedFriendList = sortFriendListByMutualFriends(suggestedFriendListUnsorted);
      this.setState({ suggestedFriendList });
      // console.log('suggestedFriends has changed, suggestedFriendList:', suggestedFriendList);
      resetDefaultTab = true;
    }
    if (resetDefaultTab) {
      this.resetDefaultTabForMobile(FriendStore.friendInvitationsSentToMe(), FriendStore.suggestedFriendList(), FriendStore.friendInvitationsSentByMe());
    }
    const friendActivityExists = Boolean((currentFriendList && currentFriendList.length) || (friendInvitationsSentByMe && friendInvitationsSentByMe.length) || (friendInvitationsSentToMe && friendInvitationsSentToMe.length) || (suggestedFriendList && suggestedFriendList.length));
    // console.log('friendActivityExists:', friendActivityExists);
    if (friendActivityExists) {
      // Only set to true -- never false in order to avoid a weird loop
      this.setState({ friendActivityExists });
    }
  }

  onAppStoreChange () {
    this.setState({
      friendsHeaderUnpinned: AppStore.getScrolledDown(),
    });
  }

  getSelectedTab () {
    const { match: { params: { tabItem } } } = this.props;
    const { currentFriendList, defaultTabItem, friendInvitationsSentByMe, friendInvitationsSentToMe, suggestedFriendList } = this.state;
    // console.log('getSelectedTab tabItem:', tabItem, ', defaultTabItem:', defaultTabItem);
    let selectedTab = tabItem || defaultTabItem;
    // Don't return a selected tab if the tab isn't available
    if (String(selectedTab) === 'requests') {
      if (friendInvitationsSentToMe.length < 1) {
        selectedTab = 'invite';
      }
    } else if (String(selectedTab) === 'suggested') {
      if (suggestedFriendList.length < 1) {
        selectedTab = 'invite';
      }
    } else if (String(selectedTab) === 'friends') {
      if (currentFriendList.length < 1) {
        selectedTab = 'invite';
      }
    } else if (String(selectedTab) === 'sent-requests') {
      if (friendInvitationsSentByMe.length < 1) {
        selectedTab = 'invite';
      }
    }
    return selectedTab;
  }

  handleNavigation = (to) => historyPush(to);

  resetDefaultTabForMobile (friendInvitationsSentToMe, suggestedFriendList, friendInvitationsSentByMe) {
    const { match: { params: { tabItem } } } = this.props;
    let defaultTabItem;
    if (tabItem) {
      // If the voter is directed to a friends tab, make that the default
      defaultTabItem = tabItem;
    } else if (friendInvitationsSentToMe && friendInvitationsSentToMe.length > 0) {
      defaultTabItem = 'requests';
    } else if (suggestedFriendList && suggestedFriendList.length > 0) {
      defaultTabItem = 'suggested';
    } else if (friendInvitationsSentByMe && friendInvitationsSentByMe.length > 0) {
      defaultTabItem = 'sent-requests';
    } else {
      defaultTabItem = 'invite';
    }
    this.setState({ defaultTabItem });
    // console.log('resetDefaultTabForMobile defaultTabItem:', defaultTabItem, ', tabItem:', tabItem);
    // We only redirect when in mobile mode, when "displayFriendsTabs()" is true
    if (displayFriendsTabs() && defaultTabItem !== tabItem) {
      this.handleNavigation(`/friends/${defaultTabItem}`);
    }
  }

  render () {
    renderLog('Friends');  // Set LOG_RENDER_EVENTS to log all renders
    const {
      currentFriendList, friendActivityExists, friendsHeaderUnpinned, friendInvitationsSentByMe,
      friendInvitationsSentToMe, suggestedFriendList, voter, voterIsSignedIn,
    } = this.state;
    const { classes, match: { params: { tabItem } } } = this.props;

    // console.log('friendsHeaderUnpinned', friendsHeaderUnpinned);

    if (!voter) {
      return LoadingWheel;
    }

    let mobileContentToDisplay;
    let desktopContentToDisplay;
    // console.log('friendActivityExists:', friendActivityExists, ', voterIsSignedIn:', voterIsSignedIn);

    // Generate mobileContentToDisplay
    switch (tabItem) {
      case 'requests':
        mobileContentToDisplay = (
          <>
            {friendInvitationsSentToMe.length > 0 ? (
              <FriendInvitationsSentToMe />
            ) : (
              <>
                {suggestedFriendList.length > 0 ? (
                  <MessageCard
                    mainText="You have no incoming friend requests. Check out people you may know."
                    buttonText="View Suggested Friends"
                    buttonURL="/friends/suggested"
                  />
                ) : (
                  <MessageCard
                    mainText="You have no incoming friend requests. Send some invites to connect with your friends!"
                    buttonText="Invite Friends"
                    buttonURL="/friends/invite"
                  />
                )}
              </>
            )}
          </>
        );
        break;
      case 'suggested':
        mobileContentToDisplay = (
          <>
            {suggestedFriendList.length > 0 ? (
              <>
                {voterIsSignedIn && (
                  <FirstAndLastNameRequiredAlert />
                )}
                <SuggestedFriends />
              </>
            ) : (
              <>
                {friendInvitationsSentToMe.length > 0 ? (
                  <MessageCard
                    mainText="You currently have no suggested friends. Check out your incoming friend requests!"
                    buttonText="View Requests"
                    buttonURL="/friends/requests"
                  />
                ) : (
                  <MessageCard
                    mainText="You currently have no suggested friends. Send some invites to connect with your friends!"
                    buttonText="Invite Friends"
                    buttonURL="/friends/invite"
                  />
                )}
              </>
            )}
          </>
        );
        break;
      case 'invite':
        mobileContentToDisplay = (
          <>
            {voterIsSignedIn && (
              <FirstAndLastNameRequiredAlert />
            )}
            <InviteByEmail />
            <SignInOptionsWrapper>
              {voter.signed_in_twitter ? null : (
                <TwitterSignInWrapper>
                  <TwitterSignInCard />
                </TwitterSignInWrapper>
              )}
              {voter.signed_in_facebook ? null : (
                <FacebookSignInWrapper>
                  <FacebookSignInCard />
                </FacebookSignInWrapper>
              )}
            </SignInOptionsWrapper>
            <FriendsPromoBox
              imageUrl={imageUrl}
              testimonialAuthor={testimonialAuthor}
              testimonial={testimonial}
              isMobile
            />
          </>
        );
        break;
      case 'current':
        mobileContentToDisplay = (
          <>
            {currentFriendList.length > 0 ? (
              <FriendsCurrent />
            ) : (
              <>
                {friendInvitationsSentToMe.length > 0 ? (
                  <MessageCard
                    mainText="You currently have no friends on We Vote, but you do have friend requests. Check them out!"
                    buttonText="View Requests"
                    buttonURL="/friends/requests"
                  />
                ) : (
                  <MessageCard
                    mainText="You currently have no friends on We Vote. Send some invites to connect with your friends!"
                    buttonText="Invite Friends"
                    buttonURL="/friends/invite"
                  />
                )}
              </>
            )}
          </>
        );
        break;
      case 'sent-requests':
        mobileContentToDisplay = (
          <>
            {friendInvitationsSentByMe.length > 0 ? (
              <FriendInvitationsSentByMe />
            ) : (
              <MessageCard
                mainText="Invite more friends now!"
                buttonText="Invite Friends"
                buttonURL="/friends/invite"
              />
            )}
          </>
        );
        break;
      default:
        mobileContentToDisplay = (
          <>
            {friendInvitationsSentToMe.length > 0 ? (
              <FriendInvitationsSentToMe />
            ) : (
              <>
                {suggestedFriendList.length > 0 ? (
                  <MessageCard
                    mainText="You have no incoming friend requests. Check out your suggested friends."
                    buttonText="View Suggested Friends"
                    buttonURL="/friends/suggested"
                  />
                ) : (
                  <MessageCard
                    mainText="You have no incoming friend requests. Send some invites to connect with your friends!"
                    buttonText="Invite Friends"
                    buttonURL="/friends/invite"
                  />
                )}
              </>
            )}
          </>
        );
    }

    // Generate desktopContentToDisplay
    switch (tabItem) {
      case 'requests':
        desktopContentToDisplay = (
          <FriendInvitationsSentToMe />
        );
        break;
      case 'suggested':
        desktopContentToDisplay = (
          <SuggestedFriends />
        );
        break;
      case 'invite':
        desktopContentToDisplay = (
          <div className="row">
            <div className="col-sm-12 col-lg-8">
              <>
                {voterIsSignedIn && (
                <FirstAndLastNameRequiredAlert />
                )}
                <InviteByEmail />
              </>
            </div>
            <div className="col-md-12 col-lg-4">
              <SignInOptionsWrapper>
                {voter.signed_in_twitter ? null : (
                  <TwitterSignInWrapper>
                    <TwitterSignInCard />
                  </TwitterSignInWrapper>
                )}
                {voter.signed_in_facebook ? null : (
                  <FacebookSignInWrapper>
                    <FacebookSignInCard />
                  </FacebookSignInWrapper>
                )}
              </SignInOptionsWrapper>
              <FriendsPromoBox
                imageUrl={imageUrl}
                testimonialAuthor={testimonialAuthor}
                testimonial={testimonial}
              />
            </div>
          </div>
        );
        break;
      case 'current':
        desktopContentToDisplay = (
          <FriendsCurrent />
        );
        break;
      case 'sent-requests':
        desktopContentToDisplay = (
          <FriendInvitationsSentByMe />
        );
        break;
      default:
        desktopContentToDisplay = (
          <>
            <Helmet title="Friends - We Vote" />
            <BrowserPushMessage incomingProps={this.props} />
            <div className="row">
              <div className="col-sm-12 col-lg-8">
                <>
                  {voterIsSignedIn && (
                    <FirstAndLastNameRequiredAlert />
                  )}
                  {!!(!voterIsSignedIn || !friendActivityExists) && (
                    <InviteByEmail />
                  )}
                  <FriendInvitationsSentToMePreview />
                  <SuggestedFriendsPreview />
                  <FriendsCurrentPreview />
                  {voterIsSignedIn && (
                    <FriendInvitationsSentByMePreview />
                  )}
                </>
              </div>
              <div className="col-md-12 col-lg-4">
                {!!(voterIsSignedIn && friendActivityExists) && (
                  <section className="card">
                    <div className="card-main">
                      <SectionTitle>
                        Invite Friends
                      </SectionTitle>
                      <TooltipIcon title="These friends will see what you support and oppose." />
                      <AddFriendsByEmail inSideColumn />
                    </div>
                  </section>
                )}
                <SignInOptionsWrapper>
                  {voter.signed_in_twitter ? null : (
                    <TwitterSignInWrapper>
                      <TwitterSignInCard />
                    </TwitterSignInWrapper>
                  )}
                  {voter.signed_in_facebook ? null : (
                    <FacebookSignInWrapper>
                      <FacebookSignInCard />
                    </FacebookSignInWrapper>
                  )}
                </SignInOptionsWrapper>
                <FriendsPromoBox
                  imageUrl={imageUrl}
                  testimonialAuthor={testimonialAuthor}
                  testimonial={testimonial}
                />
              </div>
            </div>
          </>
        );
    }

    const tabsHTML = (
      <Tabs
        value={this.getSelectedTab()}
        // onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        {friendInvitationsSentToMe.length > 0 && (
          <Tab
            classes={{ root: classes.navigationTab }}
            value="requests"
            label="Requests"
            onClick={() => {
              this.handleNavigation('/friends/requests');
            }}
          />
        )}
        {suggestedFriendList.length > 0 && (
          <Tab
            classes={{ root: classes.navigationTab }}
            value="suggested"
            label="Suggested"
            onClick={() => {
              this.handleNavigation('/friends/suggested');
            }}
          />
        )}
        <Tab
          classes={{ root: classes.navigationTab }}
          value="invite"
          label={isMobileScreenSize() ? 'Invite' : 'Invite Friends'}
          onClick={() => {
            this.handleNavigation('/friends/invite');
          }}
        />
        {currentFriendList.length > 0 && (
          <Tab
            classes={{ root: classes.navigationTab }}
            value="current"
            label="Friends"
            onClick={() => {
              this.handleNavigation('/friends/current');
            }}
          />
        )}
        {friendInvitationsSentByMe.length > 0 && (
          <Tab
            classes={{ root: classes.navigationTab }}
            value="sent-requests"
            label="Requests Sent"
            onClick={() => {
              this.handleNavigation('/friends/sent-requests');
            }}
          />
        )}
      </Tabs>
    );

    return (
      <span>
        {displayFriendsTabs() ? (
          <>
            <div className={`friends__heading ${isCordova() && 'friends__heading__cordova'} ${friendsHeaderUnpinned && isWebApp() ? 'friends__heading__unpinned' : ''}`}>
              <div className="page-content-container" style={{ marginTop: `${cordovaBallotFilterTopMargin()}` }}>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-12">
                      <Helmet title="Friends - We Vote" />
                      {tabsHTML}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="page-content-container" style={{ marginTop: `${cordovaBallotFilterTopMargin()}` }}>
              <div className="container-fluid">
                <div className="Friends__Wrapper" style={cordovaFriendsWrapper()}>
                  {mobileContentToDisplay}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="page-content-container" style={{ marginTop: `${cordovaBallotFilterTopMargin()}` }}>
            <div className="container-fluid">
              <div className="container-main">
                {desktopContentToDisplay}
              </div>
            </div>
          </div>
        )}
      </span>
    );
  }
}
Friends.propTypes = {
  classes: PropTypes.object,
  match: PropTypes.object,
};

const styles = () => ({
  tooltip: {
    display: 'inline !important',
  },
  navigationTab: {
    minWidth: '0px !important',
    width: 'fit-content !important',
    height: '40px !important',
    maxHeight: '40px !important',
  },
});

const FacebookSignInWrapper = styled.div`
  flex: 1;
  @media (min-width: 614px) and (max-width: 991px) {
    padding-left: 8px;
  }
`;

const SectionTitle = styled.h2`
  width: fit-content;
  font-weight: bolder;
  font-size: 18px;
  margin-bottom: 4px;
  display: inline;
`;

const SignInOptionsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const TwitterSignInWrapper = styled.div`
  flex: 1;
  @media (min-width: 614px) and (max-width: 991px) {
    padding-right: 8px;
  }
`;

export default withStyles(styles)(Friends);
