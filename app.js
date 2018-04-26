{
	let vm = new Vue({
		el: '#container',
		data: {
			user: '',
			userData: {
				level: 0,
				power: 0,
				reputation: 0,
				remaining: 0,
				vested: 0,
				profile_image: "",
				percent: 0
			}
		},
		watch: {
			user: function (u) {
				refreshAccountData(u)
			}
		}
	})

	function log10(str) {
		let $str = str.toString()
		const leadingDigits = parseInt($str.substring(0, 4))
		const log = Math.log(leadingDigits) / Math.log(10)
		const n = $str.length - 1
		return n + (log - parseInt(log))
	}

	function calcReputation(value) {
		if (value == null || value == 0) return 0;
		let neg = value < 0
		let reputation_level = log10(value) - 9;
		if (reputation_level < 0) reputation_level = 0;
		if (neg) reputation_level *= -1;
		return reputation_level * 9 + 25;
	}

	function calcLevel(v) {
		return Math.floor(calcReputation(v))
	}

	function calcXP(v) {
		let r = calcReputation(v);
		return 100 * (r - Math.floor(r))
	}

	function repFormat(billions) {
		return Math.abs(Number(billions)) >= 1.0e+9
			? Math.abs(Number(billions)) / 1.0e+9
			: Math.abs(Number(billions));
	}

	function setDefaultUserProfilePic() {
		vm.$set(vm.userData, 'profile_image', 'https://www.gravatar.com/avatar/000000000000000000000000000000000?d=mm&amp;f=y')
	}

	function addCommas(x) {
		var parts = x.toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	function vestCalc(vests){
		var q = parseInt(vests.slice(0, -6));
		var qmil = (q / 1000000).toFixed(2);
		return qmil;
	}

	function refreshAccountData(accountName) {
		return steem.api.getAccountsAsync([accountName])
			.then(function (result) {
				let secondsago = (new Date - new Date(result[0].last_vote_time + "Z")) / 1000
					let vpow = result[0].voting_power + (10000 * secondsago / 432000)
				if (result.length == 0) {
					vm.userData = {
						level: 0,
						power: 0,
						reputation: 0,
						remaining: 0,
						vested: 0,
						profile_image: "",
						percent: 0

					}
					return
				}

				nextLevel= Math.pow(10, (((calcLevel(result[0].reputation)+1)-25)/9)+9);
				remaining = nextLevel - result[0].reputation;

				try {
					let profile = JSON.parse(result[0].json_metadata).profile

					if (profile.profile_image != null) {
						vm.$set(vm.userData, 'profile_image', profile.profile_image)
					}
				}
				catch (err) {
					do_setDefaultUserProfilePic()
				}

				$( "li" ).removeClass( "active" )
				var whichone = parseInt(Math.floor(calcXP(result[0].reputation))/10);
				$(".prog-bar li:nth-child("+whichone+")").addClass('active');

				vm.$set(vm.userData, 'vested', vestCalc(result[0].vesting_shares))
				vm.$set(vm.userData, 'remaining', addCommas(Math.round(repFormat(remaining))))
				vm.$set(vm.userData, 'reputation', addCommas(Math.floor(repFormat(result[0].reputation))))
				vm.$set(vm.userData, 'level', calcLevel(result[0].reputation))
				vm.$set(vm.userData, 'power', Math.min(vpow / 100, 100).toFixed(2))
			})
			.catch(console.error)

	}

	refreshAccountData(vm.user)
}
