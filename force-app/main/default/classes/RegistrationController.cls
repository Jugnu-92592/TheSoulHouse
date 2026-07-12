/**
 * Controller for handling member registration from Experience Cloud.
 *
 * This controller is responsible for:
 * - Validating registration requests
 * - Creating Member__c records
 * - Returning registration results to the LWC
 *
 * Future Enhancements:
 * - Duplicate Email Check
 * - Duplicate Mobile Check
 * - Admin Approval Integration
 * - Community User Creation
 * - Email Verification
 */
public with sharing class RegistrationController {

    public class RegistrationResponse {

        @AuraEnabled
        public Boolean success;

        @AuraEnabled
        public String message;

        @AuraEnabled
        public Id memberId;
    }

    /**
    * Creates a new Member__c record.
    *
    * @param memberData Member information received from the LWC.
    * @return RegistrationResponse containing the operation result.
    */
    @AuraEnabled
    public static RegistrationResponse registerMember(Member__c memberData) {

        RegistrationResponse response = new RegistrationResponse();

        try {

            // Validate request
            if (memberData == null) {
                throw new AuraHandledException('Registration data is missing.');
            }

            // Set system-controlled default values
            memberData.Status__c = 'Pending';
            memberData.Email_Verified__c = false;
            memberData.Joined_Date__c = Date.today();

            // Save Member
            insert memberData;

            // Prepare success response
            response.success = true;
            response.message = 'Registration submitted successfully. Please wait for admin approval.';
            response.memberId = memberData.Id;

        } catch (AuraHandledException ex) {

            response.success = false;
            response.message = ex.getMessage();

        } catch (Exception ex) {

            response.success = false;
            response.message = 'Something went wrong while processing your registration. Please try again later.';

            System.debug(
                LoggingLevel.ERROR,
                'Registration Error: ' + ex.getMessage()
            );
        }

        return response;
    }

}