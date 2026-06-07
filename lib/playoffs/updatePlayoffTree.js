export default function updatePlayoffTree({matchingSeries}){
    let playoffIndexToUpdate;
    switch(matchingSeries){
        case 0: 
        case 1: {
            playoffIndexToUpdate = 8
            break;
        }
        case 2:
        case 3: {
            playoffIndexToUpdate = 9
            break;            
        }
        case 4:
        case 5: {
            playoffIndexToUpdate = 10
            break;            
        }
        case 6:
        case 7: {
            playoffIndexToUpdate = 11
            break;            
        }
        case 8:
        case 9: {
            playoffIndexToUpdate = 12
            break;            
        }
        case 10:
        case 11: {
            playoffIndexToUpdate = 13
            break;            
        }
        case 12:
        case 13: {
            playoffIndexToUpdate = 14
            break;            
        }
    }

    return playoffIndexToUpdate
}