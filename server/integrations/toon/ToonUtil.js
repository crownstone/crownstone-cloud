let idMap = {
  0: 'comfort',
  1: 'home',
  2: 'sleep',
  3: 'away',
  4: 'holiday'
};

let idMapInverse = {
  'comfort':  0,
  'home':     1,
  'sleep':    2,
  'away':     3,
  'holiday':  4,
};


let ToonUtil = {
  parseScheduleFormat: function(toonSchedule) {
    let days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let internalSchedule = {};

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      let day = days[dayIndex];
      internalSchedule[day] = [];
      for (let j = 0; j < toonSchedule.length; j++) {
        let entry = toonSchedule[j];
        if (entry.startDayOfWeek === dayIndex) {
          if (entry.endDayOfWeek === dayIndex) {
            internalSchedule[day].push({
              start:       { hour:entry.startHour, minute: entry.endMin },
              end:         { hour:entry.endHour,   minute: entry.endMin },
              program:     idMap[entry.targetState.id],
              temperature: entry.targetState.tempValue
            });
          }
          else {
            internalSchedule[day].push({
              start:       { hour:entry.startHour, minute: entry.endMin },
              end:         { hour:23,              minute: 59 },
              program:     idMap[entry.targetState.id],
              temperature: entry.targetState.tempValue
            });
          }
        }
        else if (entry.endDayOfWeek === dayIndex) {
          internalSchedule[day].push({
            start:       { hour:0,             minute: 0 },
            end:         { hour:entry.endHour, minute: entry.endMin },
            program:     idMap[entry.targetState.id],
            temperature: entry.targetState.tempValue
          });
        }
      }
      internalSchedule[day].sort((a,b) => { return (a.start.hour*60 + a.start.minute) - (b.start.hour*60 + b.start.minute)})
    }
    return internalSchedule;
  },


  parseStateFormat: function(state) {
    // "programState": 1  // following the schedule
    // "programState": 2  // temporarily different program   --> activeState is the active program
    // "programState": -1 // temporarily custom temperature  --> currentSetpoint is the set temperature
    // "programState": 4  // holiday mode

    return {
      scheduleActive: state.programState === 1,
      temperatureSet: (state.currentSetpoint || 0) / 100,
      currentTemperature: (state.currentDisplayTemp || 0) / 100,
      currentProgram: idMap[state.activeState],
    }
  },


  idMap: idMap,
  idMapInverse: idMapInverse,
}


module.exports = ToonUtil;
