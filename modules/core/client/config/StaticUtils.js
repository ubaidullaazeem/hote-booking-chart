(function() {
	'use strict';
	angular
		.module('core.constant', [])
		.constant('GOOGLE_CLIENT_ID', '228725713486-eng36vttlj0c1pt3nor8nti4j5i2laqu.apps.googleusercontent.com') //development
		//.constant('GOOGLE_CLIENT_ID', '483617748399-qg8u4g1ohm0kt9idj1kbnb7d8o35kh0m.apps.googleusercontent.com') // live
		.constant('GOOGLE_SCOPES', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly')
		.constant('GOOGLE_DISCOVERY_DOCS', ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"])
		.constant('AUTHORISED_EMAIL', 'kumar@riverstonetech.com')
		.constant('DATA_BACKGROUND_COLOR', 'blue')
		.constant('HARDCODE_VALUES', ['others'])
		.constant('CALENDAR_CHANGE_VIEW', ['agendaDay', 'agendaWeek', 'month'])
		.constant('CGST', 'CGST')
		.constant('SGST', 'SGST')
		.constant('INVOICE', 'invoice')
		.constant('RECEIPT', 'receipt')
		.constant('CLEANING_HOURS', 3)
		.constant('PAYMENT_STATUS', ['Advance Paid', 'Fully Paid'])
		.constant('TAX_TYPES', ['CGST', 'SGST'])
		.constant('BILL_TYPES', ['booking_form', 'receipt', 'invoice'])
		.constant('GOOGLE_CALENDAR_COLOR_IDS', {
			'GREEN': 10,
			"RED": 11
		})
		.constant('API', {
			'CALENDAR_LIST_URL': 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
			'CALENDAR_EVENT_LIST_URL': 'https://www.googleapis.com/calendar/v3/calendars/',
			'CALENDAR_COLOR_LIST_URL': 'https://www.googleapis.com/calendar/v3/colors'
		})
		.constant('MESSAGES', {
			'INVALID_HALL_NAME': 'Some of the hall name is not in the correct format, please enter hall name like "Emerald Hall @10000" in Google Calendar.',
			'MASTER_HALL_NOT_FOUND': 'Master hall not found.',
			'UNAUTHORISED_USER': 'You are not authorized to use this application.',
			'PRIMARY_EMAIL_ERROR': 'Primary email not found.',
			'ERROR_OCCURED': 'Error occured, please try again later.',
			'NO_BOOKINGS': 'No bookings.',
			'PAST_DATE': 'Please select the current or future dates for the new bookings.',
			'CHECK_ADVANCE_RCVD': 'Please check your payment status and advance received',
			'EVENT_TIME_OVERLAPS_WITH': 'Selected Time overlaps with existing bookings in ',
			'EVENT_TITLE_EDITED': 'Event title is edited outside of the application for some of the existing bookings on the selected date.',
			'HALL_BOOKING_SUCCESS': 'Selected Halls are booked successfully.',
			'HALL_BOOKING_ERROR': 'Unable to book the Halls.',
			'CHECK_ENTERED_DATA': 'Please enter valid data.'
		})
		.constant('PAY_MODES', ['Cheque', 'DD', 'Cash', 'NEFT']);
}).call(this);