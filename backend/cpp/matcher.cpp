// SIMPLE MATCHING ALGORITHM - sorting drivers by distance and returning the top 3.

#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int riders, drivers;
    cin >> riders >> drivers;

    vector<int> driverIds(drivers);
    for (int j = 0; j < drivers; j++) cin >> driverIds[j];

    vector<vector<double>> cost(riders, vector<double>(drivers));
    for (int i = 0; i < riders; i++)
        for (int j = 0; j < drivers; j++)
            cin >> cost[i][j];

    int K = min(3, drivers); // Top K drivers

    cout << "{ \"assignments\": [";
    for (int i = 0; i < riders; i++) {
        vector<pair<double,int>> temp;
        for (int j = 0; j < drivers; j++)
            temp.push_back({cost[i][j], driverIds[j]}); // use driverId
        sort(temp.begin(), temp.end());

        cout << "{ \"rider\": " << i+1 << ", \"drivers\": [";
        for (int k = 0; k < K; k++) {
            cout << "{ \"driver_id\": " << temp[k].second
                 << ", \"distance\": " << temp[k].first
                 << " }";
            if (k != K-1) cout << ", ";
        }
        cout << "] }";
        if (i != riders-1) cout << ", ";
    }
    cout << "] }" << endl;

    return 0;
}


// COMPLEX MATCHING ALGORITHM - considers distance, ETA, driver ratings, cancellation history, surge pricing, and fairness.

// #include <bits/stdc++.h>
// using namespace std;

// struct Driver {
//     int id;
//     double distance;
//     double rating;
//     double cancelRate;
//     double idleMinutes;
// };

// // Composite cost function
// double computeCost(const Driver& d) {
//     double w1 = 0.7, w2 = 0.2, w3 = 0.1, w4 = -0.05; 
//     // lower is better
//     return w1 * d.distance 
//          + w2 * (5.0 - d.rating)   // better rating = lower cost
//          + w3 * d.cancelRate       // frequent cancellations = penalty
//          + w4 * d.idleMinutes;     // idle longer = priority
// }

// int main() {
//     ios::sync_with_stdio(false);
//     cin.tie(nullptr);

//     int riders, drivers;
//     cin >> riders >> drivers;

//     vector<int> driverIds(drivers);
//     for (int j = 0; j < drivers; j++) cin >> driverIds[j];

//     vector<vector<double>> cost(riders, vector<double>(drivers));
//     for (int i = 0; i < riders; i++)
//         for (int j = 0; j < drivers; j++)
//             cin >> cost[i][j];

//     // Simulated extra attributes (would come from DB in real world)
//     vector<double> ratings(drivers, 4.5);      // avg ~4.5 stars
//     vector<double> cancelRates(drivers, 0.1);  // 10% cancellation
//     vector<double> idleTimes(drivers, 15);     // idle mins

//     int K = min(3, drivers);

//     cout << "{ \"assignments\": [";
//     for (int i = 0; i < riders; i++) {
//         vector<pair<double, int>> ranked;

//         for (int j = 0; j < drivers; j++) {
//             Driver d = {driverIds[j], cost[i][j], ratings[j], cancelRates[j], idleTimes[j]};
//             double score = computeCost(d);
//             ranked.push_back({score, d.id});
//         }

//         sort(ranked.begin(), ranked.end());

//         cout << "{ \"rider\": " << i+1 << ", \"drivers\": [";
//         for (int k = 0; k < K; k++) {
//             cout << "{ \"driver_id\": " << ranked[k].second
//                  << ", \"score\": " << ranked[k].first
//                  << " }";
//             if (k != K-1) cout << ", ";
//         }
//         cout << "] }";
//         if (i != riders-1) cout << ", ";
//     }
//     cout << "] }" << endl;

//     return 0;
// }
