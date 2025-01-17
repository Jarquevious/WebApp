import { ReduceStore } from 'flux/utils';
import OrganizationActions from '../actions/OrganizationActions';
import Dispatcher from '../dispatcher/Dispatcher';
import VoterStore from './VoterStore';

class DonateStore extends ReduceStore {
  getInitialState () {  // This is a mandatory override, so it can't be static.
    return {
      activePaidPlan: {
        coupon_code: '',
        next_invoice: {
          invoice_date: '',
          amount_due: '',
          period_start: '',
          period_end: '',
          credit_card_last_four: '',
          credit_card_expiration: '',
          billing_contact: '',
        },
        plan_type_enum: '',
        subscription_active: '',
        donation_plan_id: '',
      },
      defaultPricing: {
        chosenFaviconRecommendedPlan: '',
        chosenFullDomainRecommendedPlan: '',
        chosenGoogleAnalyticsRecommendedPlan: '',
        chosenPromotedOrganizationsRecommendedPlan: '',
        chosenSocialShareImageRecommendedPlan: '',
        chosenSocialShareDescriptionRecommendedPlan: '',
        enterprisePlanFullPricePerMonthPayMonthly: 0,
        enterprisePlanFullPricePerMonthPayYearly: 0,
        proPlanFullPricePerMonthPayMonthly: 0,
        proPlanFullPricePerMonthPayYearly: 0,
        validForProfessionalPlan: false,
        validForEnterprisePlan: false,
        status: 'From getInitialState',
        success: true,
      },
      donationJournalList: [
        {
          created: '',
          amount: '',
        },
      ],
      subscriptionJournalHistory: [
        {
          created: '',
          amount: '',
        },
      ],
      lastCouponResponseReceived: {
        couponAppliedMessage: '',
        couponCodeString: '',
        couponDiscountValue: 0,
        couponMatchFound: false,
        couponReceived: false,
        couponStillValid: '',
        enterprisePlanCouponPricePerMonthPayMonthly: 0,
        enterprisePlanCouponPricePerMonthPayYearly: 0,
        listPriceMonthlyCredit: '',
        proPlanCouponPricePerMonthPayMonthly: 0,
        proPlanCouponPricePerMonthPayYearly: 0,
        validForProfessionalPlan: false,
        validForEnterprisePlan: false,
        status: 'From getInitialState',
        success: false,
      },
    };
  }

  resetState () {
    return this.getInitialState();
  }

  donationSuccess () {
    return this.getState().success;
  }

  donationError () {
    return this.getState().stripeErrorMessageForVoter || '';
  }

  donationResponseReceived () {
    return this.getState().donationResponseReceived;
  }

  // Voter's donation history
  getVoterDonationHistory () {
    return this.getState().donationJournalList || [];
  }

  // Organization's subscription payment history
  getSubscriptionJournalHistory () {
    return this.getState().subscriptionJournalHistory || [];
  }

  getActivePaidPlan () {
    return this.getState().activePaidPlan || {};
  }

  getAmountPaidViaStripe () {
    return this.getState().amountPaidViaStripe || 0;
  }

  getNextInvoice () {
    const activePaidPlan = this.getState().activePaidPlan || null;
    if (activePaidPlan && activePaidPlan.next_invoice) {
      return this.getState().activePaidPlan.next_invoice || {};
    }
    return {};
  }

  getPlanTypeEnum () {
    return this.getState().planTypeEnum || '';
  }

  getCouponMessageTest () {
    return this.getState().coupon_applied_message;
  }

  getCouponMessage () {
    const lastCouponResponseReceived = this.getState().lastCouponResponseReceived || {};
    if (!lastCouponResponseReceived) {
      return '';
    } else {
      return lastCouponResponseReceived.couponAppliedMessage || '';
    }
  }

  getDefaultPricing () {
    return this.getState().defaultPricing || {};
  }

  getLastCouponResponseReceived () {
    return this.getState().lastCouponResponseReceived || {};
  }

  getOrgSubscriptionAlreadyExists () {
    return this.getState().orgSubsAlreadyExists || false;
  }

  doesOrgHavePaidPlan () {
    return this.getState().doesOrgHavePaidPlan || false;
  }

  reduce (state, action) {
    if (!action.res) return state;
    // DALE 2019-09-19 Migrate away from orgSubsAlreadyExists and doesOrgHavePaidPlan -- donationHistory/activePaidPlan provides what we need
    const {
      charge_id: charge,
      donation_amount: donationAmount,
      monthly_donation: monthlyDonation,
      org_subs_already_exists: orgSubsAlreadyExists,
      org_has_active_paid_plan: doesOrgHavePaidPlan,
      saved_stripe_donation: savedStripeDonation,
      subscription_id: subscriptionId,
      success,
    } = action.res;
    const donationAmountSafe = donationAmount || '';
    let { defaultPricing, lastCouponResponseReceived } = state;
    let activePaidPlan = {};
    let amountPaidViaStripe = 0;
    let apiStatus = '';
    let apiSuccess = false;
    let completeDonationJournalList = [];
    let couponAppliedMessage = '';
    let couponCodeString = '';
    let couponMatchFound = '';
    let couponStillValid = '';
    let donationJournalList = [];
    let enterprisePlanCouponPricePerMonthPayMonthly = '';
    let enterprisePlanCouponPricePerMonthPayYearly = '';
    let enterprisePlanFullPricePerMonthPayMonthly = '';
    let enterprisePlanFullPricePerMonthPayYearly = '';
    let organizationSaved = false;
    let planTypeEnum = '';
    let proPlanCouponPricePerMonthPayMonthly = '';
    let proPlanCouponPricePerMonthPayYearly = '';
    let proPlanFullPricePerMonthPayMonthly = '';
    let proPlanFullPricePerMonthPayYearly = '';
    let stripeErrorMessageForVoter = '';
    let subscriptionJournalHistory = [];
    let validForProfessionalPlan = '';
    let validForEnterprisePlan = '';
    switch (action.type) {
      case 'donationWithStripe':
        ({
          active_paid_plan: activePaidPlan,
          amount_paid: amountPaidViaStripe,
          donation_list: completeDonationJournalList,
          error_message_for_voter: stripeErrorMessageForVoter,
          organization_saved: organizationSaved,
          plan_type_enum: planTypeEnum,
          status: apiStatus,
          success: apiSuccess,
        } = action.res);
        donationJournalList = completeDonationJournalList.filter((item) => (item.is_organization_plan === false));
        subscriptionJournalHistory = completeDonationJournalList.filter((item) => (item.is_organization_plan === true));
        if (success === false) {
          console.log(`donation with stripe failed:  ${stripeErrorMessageForVoter}  ---  ${apiStatus}`);
        }
        // console.log('amountPaidViaStripe: ', amountPaidViaStripe);
        // DALE 2019-09-19 Migrate away from orgSubsAlreadyExists -- donationHistory provides what we need
        if (organizationSaved) {
          OrganizationActions.organizationRetrieve(VoterStore.getLinkedOrganizationWeVoteId());
        }
        return {
          ...state,
          activePaidPlan,
          amountPaidViaStripe,
          apiStatus,
          donationAmount: donationAmountSafe,
          donationJournalList,
          stripeErrorMessageForVoter,
          monthlyDonation,
          planTypeEnum,
          savedStripeDonation,
          subscriptionJournalHistory,
          success,
          orgSubsAlreadyExists,
          donationResponseReceived: true,
        };

      case 'error-donateRetrieve':
        console.log(`error-donateRetrieve${action}`);
        return state;

      case 'donationCancelSubscription':
        // console.log(`donationCancelSubscription: ${action}`);
        ({
          active_paid_plan: activePaidPlan,
          donation_list: completeDonationJournalList,
          organization_saved: organizationSaved,
        } = action.res);
        donationJournalList = completeDonationJournalList.filter((item) => (item.is_organization_plan === false));
        subscriptionJournalHistory = completeDonationJournalList.filter((item) => (item.is_organization_plan === true));
        if (organizationSaved) {
          OrganizationActions.organizationRetrieve(VoterStore.getLinkedOrganizationWeVoteId());
        }
        return {
          ...state,
          activePaidPlan,
          donationCancelCompleted: false,
          donationJournalList,
          subscriptionId,
          subscriptionJournalHistory,
        };

      case 'donationHistory':
        // console.log('Donate Store, donationHistory action.res: ', action.res);
        ({
          active_paid_plan: activePaidPlan,
          donation_list: completeDonationJournalList,
        } = action.res);

        if (completeDonationJournalList) {
          donationJournalList = completeDonationJournalList.filter((item) => (item.is_organization_plan === false));
          subscriptionJournalHistory = completeDonationJournalList.filter((item) => (item.is_organization_plan === true));
        } else {
          console.error('undefined completeDonationJournalList in DonateStore donationHistory');
        }
        return {
          ...state,
          activePaidPlan,
          donationJournalList,
          subscriptionJournalHistory,
        };

      case 'donationRefund':
        // console.log(`donationRefund: ${action}`);
        ({
          donation_list: completeDonationJournalList,
        } = action.res);
        donationJournalList = completeDonationJournalList.filter((item) => (item.is_organization_plan === false));
        subscriptionJournalHistory = completeDonationJournalList.filter((item) => (item.is_organization_plan === true));
        return {
          ...state,
          charge,
          donationJournalList,
          donationRefundCompleted: false,
          subscriptionJournalHistory,
        };

      case 'doesOrgHavePaidPlan':
        // DALE 2019-09-19 Migrate away from this -- donationHistory provides what we need
        // console.log(`doesOrgHavePaidPlan: ${action}`);
        return {
          ...state,
          doesOrgHavePaidPlan,
        };

      case 'latestCouponViewed':
        // Update the lastCouponResponseReceived with the information that it has been viewed by another component
        lastCouponResponseReceived = { ...lastCouponResponseReceived, couponViewed: action.payload };
        return {
          ...state,
          lastCouponResponseReceived,
        };

      case 'voterSignOut':
        // console.log("resetting DonateStore");
        return this.resetState();

      case 'defaultPricing':
        ({
          enterprise_plan_full_price_per_month_pay_monthly: enterprisePlanFullPricePerMonthPayMonthly,
          enterprise_plan_full_price_per_month_pay_yearly: enterprisePlanFullPricePerMonthPayYearly,
          pro_plan_full_price_per_month_pay_monthly: proPlanFullPricePerMonthPayMonthly,
          pro_plan_full_price_per_month_pay_yearly: proPlanFullPricePerMonthPayYearly,
          valid_for_enterprise_plan: validForEnterprisePlan,
          valid_for_professional_plan: validForProfessionalPlan,
          status: apiStatus,
          success: apiSuccess,
        } = action.res);
        defaultPricing = {
          enterprisePlanFullPricePerMonthPayMonthly,
          enterprisePlanFullPricePerMonthPayYearly,
          proPlanFullPricePerMonthPayMonthly,
          proPlanFullPricePerMonthPayYearly,
          validForEnterprisePlan,
          validForProfessionalPlan,
          status: apiStatus,
          success: apiSuccess,
        };
        return {
          ...state,
          defaultPricing,
        };

      case 'couponSummaryRetrieve':
        ({
          coupon_applied_message: couponAppliedMessage,
          coupon_code_string: couponCodeString,
          coupon_match_found: couponMatchFound,
          coupon_still_valid: couponStillValid,
          enterprise_plan_coupon_price_per_month_pay_monthly: enterprisePlanCouponPricePerMonthPayMonthly,
          enterprise_plan_coupon_price_per_month_pay_yearly: enterprisePlanCouponPricePerMonthPayYearly,
          pro_plan_coupon_price_per_month_pay_monthly: proPlanCouponPricePerMonthPayMonthly,
          pro_plan_coupon_price_per_month_pay_yearly: proPlanCouponPricePerMonthPayYearly,
          valid_for_enterprise_plan: validForEnterprisePlan,
          valid_for_professional_plan: validForProfessionalPlan,
          status: apiStatus,
          success: apiSuccess,
        } = action.res);
        lastCouponResponseReceived = {
          couponAppliedMessage,
          couponCodeString,
          couponMatchFound,
          couponReceived: true,
          couponStillValid,
          couponViewed: false,
          enterprisePlanCouponPricePerMonthPayMonthly,
          enterprisePlanCouponPricePerMonthPayYearly,
          proPlanCouponPricePerMonthPayMonthly,
          proPlanCouponPricePerMonthPayYearly,
          validForEnterprisePlan,
          validForProfessionalPlan,
          status: apiStatus,
          success: apiSuccess,
        };
        return {
          ...state,
          lastCouponResponseReceived,
        };

      case 'validateCoupon':
        return {
          ...state,
          annual_price_stripe: action.res.annual_price_stripe,
          coupon_applied_message: action.res.coupon_applied_message,
          coupon_match_found: action.res.coupon_match_found,
          coupon_still_valid: action.res.coupon_still_valid,
          monthly_price_stripe: action.res.monthly_price_stripe,
          status: action.res.status,
          success: action.res.success,
        };

        // // TODO: Dale needs to revive for his new upgrade, contains test code
        // case 'validateCoupon':
        //   ({
        //     coupon_applied_message: couponAppliedMessage,
        //     coupon_match_found: couponMatchFound,
        //     list_price_monthly_credit: listPriceMonthlyCredit,
        //   } = action.res);
        //   return {
        //     success: true,
        //     couponAppliedMessage,
        //     couponMatchFound,
        //     couponStillValid,
        //     discountedPriceMonthlyCredit,
        //     listPriceMonthlyCredit,
        //     status,
        //   };

      default:
        return state;
    }
  }
}

export default new DonateStore(Dispatcher);
