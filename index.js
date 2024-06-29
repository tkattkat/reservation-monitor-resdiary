const axios = require('axios');
const restaurantId = 'bite';
const startDate = '2024-06-29';
const endDate = '2024-06-30';
let data = JSON.stringify({
  "DateFrom": `${startDate}T00:00:00`,
  "DateTo": `${endDate}T00:00:00`,
  "PartySize": 2,
  "ChannelCode": "ONLINE",
  "PromotionId": null,
  "AreaId": null,
  "AvailabilityType": "Reservation"
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: `https://booking.resdiary.com/api/Restaurant/${restaurantId}/AvailabilityForDateRange`,
  headers: { 
    'accept': '*/*', 
    'accept-language': 'en-US,en;q=0.9', 
    'content-type': 'application/json', 
    'origin': 'https://booking.resdiary.com', 
    'priority': 'u=1, i', 
    'referer': `https://booking.resdiary.com/widget/Standard/${restaurantId}/277`, 
    'sec-fetch-dest': 'empty', 
    'sec-fetch-mode': 'cors', 
    'sec-fetch-site': 'same-origin', 
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', 
    'x-requested-with': 'XMLHttpRequest'
  },
  data : data
};


const DISCORD_WEBHOOK_URL = '';

let existingTimes = {};


async function sendDiscordNotification(message) {
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content: message });
    console.log('Discord notification sent successfully');
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

async function checkForNewTimes(newData) {
  let newTimes = {};
  let newTimesMessage = [];

  newData.AvailableDates.forEach(date => {
    const dateStr = date.Date.split('T')[0];
    newTimes[dateStr] = new Set(date.AvailableTimes.map(t => t.TimeSlot));

    if (!existingTimes[dateStr]) {
      newTimesMessage.push(`New date available: ${dateStr}\nAvailable times: ${[...newTimes[dateStr]].join(', ')}`);
    } else {
      const newAvailableTimes = [...newTimes[dateStr]].filter(time => !existingTimes[dateStr].has(time));
      if (newAvailableTimes.length > 0) {
        newTimesMessage.push(`New times available for ${dateStr}: ${newAvailableTimes.join(', ')}`);
      }
    }
  });

  if (newTimesMessage.length > 0) {
    const message = `New reservation times available:\n\n${newTimesMessage.join('\n\n')}`;
    await sendDiscordNotification(message);
  } else {
    console.log('No new times available.');
  }

  existingTimes = newTimes;
}


function scheduleCheck() {
  axios.request(config)
    .then(async (response) => {
      await checkForNewTimes(response.data);
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
    
      setTimeout(scheduleCheck, 10000); //10  second delay
    });
}

// Start the periodic checks
scheduleCheck();
