var app = new Vue({
    el: '#app',
    data: {
        stations: [
            { text: 'AA', x: 0, y: 0 },
            { text: 'AB', x: 0, y: 1 },
            { text: 'AC', x: 0, y: 2 },
            { text: 'AD', x: 0, y: 3 },
            { text: 'BA', x: 1, y: 0 },
            { text: 'BB', x: 1, y: 1 },
            { text: 'BC', x: 1, y: 2 },
            { text: 'BD', x: 1, y: 3 },
            { text: 'CA', x: 2, y: 0 },
            { text: 'CB', x: 2, y: 1 },
            { text: 'CC', x: 2, y: 2 },
            { text: 'CD', x: 2, y: 3 },
            { text: 'DA', x: 3, y: 0 },
            { text: 'DB', x: 3, y: 1 },
            { text: 'DC', x: 3, y: 2 },
            { text: 'DD', x: 3, y: 3 }
          ],
          
            //availableX: steps from (x,y) to (x+1,y) and back
            //availableY: steps from (x,y) to (x,y+1) and back
          possible: [
            { x: 0, y: 0, availableX: [true , true, true ], availableY: [true, true , true] },
            { x: 0, y: 1, availableX: [false, true , true ], availableY: [true , true , false] },
            { x: 0, y: 2, availableX: [true , true , false], availableY: [true , false, true ] },
            { x: 0, y: 3, availableX: [true , false, true ], availableY: [false, false, false] },
            { x: 1, y: 0, availableX: [false, true , false], availableY: [true , true , false] },
            { x: 1, y: 1, availableX: [true , false, false], availableY: [false, true , true ] },
            { x: 1, y: 2, availableX: [false, true , false], availableY: [true , true , true ] },
            { x: 1, y: 3, availableX: [true , true , true ], availableY: [false, false, false] },
            { x: 2, y: 0, availableX: [true , false, false], availableY: [true , false, false] },
            { x: 2, y: 1, availableX: [true , true , true ], availableY: [false, true , false] },
            { x: 2, y: 2, availableX: [false, false, true ], availableY: [true , true , true ] },
            { x: 2, y: 3, availableX: [true , false, false], availableY: [false, false, false] },
            { x: 3, y: 0, availableX: [false, false, false], availableY: [true , false, true ] },
            { x: 3, y: 1, availableX: [false, false, false], availableY: [false, true , false] },
            { x: 3, y: 2, availableX: [false, false, false], availableY: [true , false, true ] }
          ],

          to0: true, to1: true, to2: true,
          travelOptions: [
            { checked: true, price: 5, reservationPrice: 1, name: "Bicycle", duration: 10 },
            { checked: true, price: 10, reservationPrice: 3, name: "Bus", duration: 5 },
            { checked: true, price: 14, reservationPrice: 10, name: "Taxi", duration: 2 },
          ],

        startName: '',
        endName: '',
        picked: "Cheapest",

        wallet: 100,

        showPath: false,
        showError: false,

        distance: 0,
        price: 0,
        reservationPrice: 0,
        duration: 0,
        path: '',
        pathList: [],

        page: 1,
        interval: ""
    },
    methods: {
        calculate: function () {
            this.showPath = false
            this.showError = false

            //finds the station with the chosen name, sets the travelOptions array
            start = this.stations.filter(obj => { return obj.text == this.startName })[0]
            end   = this.stations.filter(obj => { return obj.text == this.endName   })[0]
            this.travelOptions[0].checked = this.to0;
            this.travelOptions[1].checked = this.to1;
            this.travelOptions[2].checked = this.to2;

            //calculates the distance and direction in both x and y direction
            distanceX = end.x - start.x; if(distanceX < 0) { directionX = -1 } else { directionX = 1 }
            distanceY = end.y - start.y; if(distanceY < 0) { directionY = -1 } else { directionY = 1 }
            this.distance = Math.abs(distanceX) + Math.abs(distanceY)

            //resets the values, necessary for repeated requests
            this.price    = 0
            this.duration = 0
            this.path    = ''
            this.pathList = []

            //current coordinates, change during algorithm
            curX = start.x
            curY = start.y

            while (curX != end.x || curY != end.y) {
                
                stepX = null
                stepY = null

                //find the travelOption from the current square in the direction leading to the end
                if(directionX < 0){ stepX = this.possible.filter(obj => { return obj.x == curX - 1 && obj.y == curY     })[0] }
                else              { stepX = this.possible.filter(obj => { return obj.x == curX     && obj.y == curY     })[0] }
                
                if(directionY < 0){ stepY = this.possible.filter(obj => { return obj.x == curX     && obj.y == curY - 1 })[0] }
                else              { stepY = this.possible.filter(obj => { return obj.x == curX     && obj.y == curY     })[0] }
    
                //add the current position to the path description
                this.path += this.stations.filter(obj => {return obj.x == curX && obj.y == curY})[0].text + " to "

                step = null

                //determine the best step and travelOption
                pickedOption = null;
                if(this.picked == "Cheapest"){
                    for(i = 0; i < this.travelOptions.length; i++){
                        if(this.travelOptions[i].checked){
                            if      (curX != end.x && stepX.availableX[i]){ curX += directionX; pickedOption = this.travelOptions[i]; step = stepX; break }
                            else if (curY != end.y && stepY.availableY[i]){ curY += directionY; pickedOption = this.travelOptions[i]; step = stepY; break }
                        }
                    }
                }
                else {
                    for(i = this.travelOptions.length - 1; i > -1; i--){
                        if(this.travelOptions[i].checked){
                            if      (curX != end.x && stepX.availableX[i]){ curX += directionX; pickedOption = this.travelOptions[i]; step = stepX; break }
                            else if (curY != end.y && stepY.availableY[i]){ curY += directionY; pickedOption = this.travelOptions[i]; step = stepY; break }
                        }
                    }
                }

                //Checks whether there is a way available
                if(pickedOption == null){
                    this.price    = 0
                    this.duration = 0
                    this.path = ''
                    this.showPath = false
                    this.showError = true
                    return
                }

                this.using = pickedOption.name
                this.duration += pickedOption.duration
                this.price += pickedOption.price + pickedOption.reservationPrice
                this.reservationPrice += pickedOption.reservationPrice

                this.path += this.stations.filter(obj => {return obj.x == curX && obj.y == curY})[0].text + " using " + this.using + '\n';

                this.pathList.push({step: step, option: pickedOption})
                this.showPath = true
                this.showError = false
            }
        },

        chooseTrip: function() {
            this.page = 2
            this.interval = setInterval(this.travel, 2000)
            this.wallet -= this.reservationPrice;
            if(this.wallet < 0) { this.wallet += 100 }
            this.reservationPrice = 0
        },

        travel: function () {
            this.distance--
            this.price -= this.pathList[0].option.price
            this.wallet -= this.pathList[0].option.price; if(this.wallet < 0) { this.wallet += 100 }
            this.duration -= this.pathList[0].option.duration
            this.path = this.path.slice(this.path.search('\n') + 1)
            this.pathList.shift()
            if(this.distance > 0)
            {
                this.startName = this.stations.filter(obj => { return this.pathList[0].step.x == obj.x && this.pathList[0].step.y == obj.y })[0].text
            }
            else
            {
                this.startName = this.endName
                this.cancelTrip()
            }
        },

        cancelTrip: function() {
            clearInterval(this.interval)
            this.page = 1
            this.endName = ''
            this.duration = 0
            this.price = 0
            this.path = ''
            this.showPath = false
        }
    }
})