/*
========================================================
Component : registrationForm
Project   : The Soul House
Purpose   : Magnet Registration Page
Author    : Jugnu Rana
========================================================
*/

import { LightningElement } from 'lwc';
import LOGO from '@salesforce/resourceUrl/TheSoulHouseLogo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import registerMember from '@salesforce/apex/RegistrationController.registerMember';

    const NAME_REGEX = /^[A-Za-z ]+$/;
    const AADHAAR_REGEX = /^\d{12}$/;
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export default class RegistrationForm extends LightningElement {

    logoUrl = LOGO;
    

    genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' }
    ];

    // Registration Data
    member = {
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        mobile: '',
        gender: '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        country: '',
        aadharNumber:'',
        panNumber:''
    };

    /**
    * Resets the registration form.
    */
    resetForm() {
        this.member = {
            firstName: '',
            middleName: '',
            lastName: '',
            email: '',
            mobile: '',
            gender: '',
            dateOfBirth: '',
            address: '',
            city: '',
            state: '',
            country: '',
            aadharNumber: '',
            panNumber: ''
        };
    }

    handleInputChange(event){
        const fieldName = event.target.name;
        const fieldValue = event.target.value;

        this.member = { ...this.member, [fieldName]: fieldValue };
        console.log('Member Data : ', JSON.stringify(this.member));
    }

    /**
        * Register Button Click
    */
    async handleRegister() {
        const isValid = await this.validateForm();

        if (!isValid) {
            return;
        }

        console.log('Validation Successful');
    }
    
    /**
    * Validate Complete Form
    */
    async validateForm() {

        if (!this.validateRequiredFields()) {
            return false;
        }

        if (!this.validateMobile()) {
            return false;
        }

        if (!this.validateDateOfBirth()) {
            return false;
        }

        if (!this.validateNameFields()) {
            return false;
        }

        if (!this.validateAadhaar()) {
            return false;
        }

        if (!this.validatePan()) {
            return false;
        }

        // Normalize data before saving
        this.normalizeMemberData();

        /*if (!this.validateEmail()) {
            return false;
        } */

        // Call Apex
        await this.saveMember();

        return true;
    }

    /**
    * Trims whitespace from all string fields in the member object.
    */
    normalizeMemberData() {
        Object.keys(this.member).forEach((key) => {
            if (typeof this.member[key] === 'string') {
                this.member[key] = this.member[key].trim();
            }
        });
    }

    /**
    * Validate Required Fields
    */
    validateRequiredFields() {

        const inputs = [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-textarea'),
            ...this.template.querySelectorAll('lightning-combobox')
        ];

        return inputs.every(input => {
            input.reportValidity();
            return input.checkValidity();
        });

    }
    /**
    * Validate Mobile Number
    * @returns {Boolean}
    */
    validateMobile() {

        const mobileInput = this.template.querySelector(
            '[data-field="mobile"]'
        );

        const mobile = (this.member.mobile || '').trim();


        if (!mobile) {
            return true;
        }


        const mobileRegex = /^[6-9]\d{9}$/;


        if (!mobileRegex.test(mobile)) {

            if (mobileInput) {

                mobileInput.setCustomValidity(
                    'Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.'
                );

                mobileInput.reportValidity();

            }

            return false;
        }


        if (mobileInput) {

            mobileInput.setCustomValidity('');
            mobileInput.reportValidity();

        }


        return true;

    }

    /**
     * Validates fields that should contain only alphabets and spaces.
     *
     * @param {string} fieldName - Data field selector value.
     * @param {string} value - User entered value.
     * @returns {boolean} True if valid.
     */
    validateNameField(fieldName, value) {
        const inputField = this.template.querySelector(
            `[data-field="${fieldName}"]`
        );

        if (!inputField) {
            return true;
        }

        const trimmedValue = value.trim();

        if (trimmedValue && !NAME_REGEX.test(trimmedValue)) {
            inputField.setCustomValidity(
                'Only alphabets and spaces are allowed.'
            );
            inputField.reportValidity();
            return false;
        }

        inputField.setCustomValidity('');
        inputField.reportValidity();

        return true;
    }

    /**
    * Validates all text fields that allow only alphabets and spaces.
    *
    * @returns {boolean} True when every field is valid.
    */
    validateNameFields() {
        return (
            this.validateNameField('firstName', this.member.firstName) &&
            this.validateNameField('middleName', this.member.middleName) &&
            this.validateNameField('lastName', this.member.lastName) &&
            this.validateNameField('city', this.member.city) &&
            this.validateNameField('state', this.member.state) &&
            this.validateNameField('country', this.member.country)
        );
    }


    /**
    * Validates the Date of Birth field.
    * Future dates are not allowed.
    *
    * @returns {boolean} True when the date is valid.
    */
    validateDateOfBirth() {
        const dobField = this.template.querySelector('[data-field="dob"]');

        if (!dobField) {
            return true;
        }

        const dobValue = this.member.dob;

        // Skip validation if no value is entered.
        // Required validation already handles empty values.
        if (!dobValue) {
            dobField.setCustomValidity('');
            dobField.reportValidity();
            return true;
        }

        const selectedDate = new Date(dobValue);

        // Normalize today's date to midnight.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            dobField.setCustomValidity('Date of Birth cannot be a future date.');
            dobField.reportValidity();
            return false;
        }

        dobField.setCustomValidity('');
        dobField.reportValidity();

        return true;
    }

    /**
    * Validates the Aadhaar Number.
    * Must contain exactly 12 numeric digits.
    *
    * @returns {boolean} True when the value is valid.
    */
    validateAadhaar() {
        const aadhaarField = this.template.querySelector('[data-field="aadhaarNumber"]');

        if (!aadhaarField) {
            return true;
        }

        const aadhaarValue = this.member.aadhaarNumber?.trim();

        // Required validation handles empty values.
        if (!aadhaarValue) {
            aadhaarField.setCustomValidity('');
            aadhaarField.reportValidity();
            return true;
        }

        if (!AADHAAR_REGEX.test(aadhaarValue)) {
            aadhaarField.setCustomValidity(
                'Aadhaar Number must contain exactly 12 digits.'
            );
            aadhaarField.reportValidity();
            return false;
        }

        aadhaarField.setCustomValidity('');
        aadhaarField.reportValidity();

        return true;
    }

    /**
    * Validates the PAN Number.
    * Format: ABCDE1234F
    *
    * @returns {boolean} True when the PAN Number is valid.
    */
    validatePan() {
        const panField = this.template.querySelector('[data-field="panNumber"]');

        if (!panField) {
            return true;
        }

        const panValue = this.member.panNumber?.trim().toUpperCase();

        // Required validation handles empty values.
        if (!panValue) {
            panField.setCustomValidity('');
            panField.reportValidity();
            return true;
        }

        console.log('PAN_REGEX:', PAN_REGEX);
        if (!PAN_REGEX.test(panValue)) {
            panField.setCustomValidity(
                'Enter a valid PAN Number (Example: ABCDE1234F).'
            );
            panField.reportValidity();
            return false;
        }

        panField.setCustomValidity('');
        panField.reportValidity();

        // Store the normalized value in uppercase.
        this.member.panNumber = panValue;

        return true;
    }

    /**
    * Saves the member registration by calling the Apex controller.
    *
    * @returns {Promise<void>}
    */
    async saveMember() {
        try {
            const response = await registerMember({
                memberData: this.member
            });

            if (response.success) {
                this.showSuccessToast(response.message);
                this.resetForm();
                return;
            }

            this.showErrorToast(response.message);

        } catch (error) {
            console.error('Save Member Error:', error);
            this.showErrorToast(
                error?.body?.message ||
                'An unexpected error occurred while submitting your registration.'
            );
        }
    }


    /**
    * Displays a success toast message.
    *
    * @param {string} message Toast message.
    */
    showSuccessToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message,
                variant: 'success'
            })
        );
    }


    /**
    * Displays an error toast message.
    *
    * @param {string} message Toast message.
    */
    showErrorToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }




























































































    


}