/* eslint-disable no-useless-escape */
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import io from 'socket.io-client';
import YouTube from 'react-youtube';
import { notyfError, notyfSuccess } from '../utils/notyf';

import {
	PLAY,
	GET_INVITE_CODE,
	JOIN,
	PAUSE,
	SYNC_TIME,
	SYNC_WITH_HOST,
	GET_HOST_TIME,
	GET_VIDEO_INFORMATION,
	SYNC_VIDEO_INFORMATION,
	SYNC_VIDEO_WITH_HOST,
	VIDEO_CHANGED,
	SEND_MESSAGE,
	MESSAGE,
	GET_USERS,
	NEW_USER_JOINED,
	SET_HOST,
	SET_NEW_HOST,
	NOTIFY_CLIENT_SUCCESS,
	NOTIFY_CLIENT_ERROR,
	GET_QUEUE,
	ADD_TO_QUEUE,
	REMOVE_FROM_QUEUE
} from '../SocketActions';

import { SettingsContext } from '../context/SettingsContext';
import Loading from '../components/Loading';
import Tabs from '../components/VideoRoom/Tabs/Tabs';
import CurrentTab from '../components/VideoRoom/CurrentTab';

const socketURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : process.env.REACT_APP_GAE_API_URL;
const YOUTUBE_VIDEO_URL_REGEX = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/|\/embed\/.+$/;

const youtubeConfig = {
	height: '390',
	width: '640',
	playerVars: {
		controls: 2,
		rel: 0,
		modestbranding: 1,
		autoplay: 1,
		origin: 'https://vaadakekoos.web.app'
	},
};

export class VideoRoom extends Component {
	static contextType = SettingsContext;

	state = {
		socket: null,
		player: null,
		users: [],
		messages: [],
		host: null,
		videoURL: '',
		loading: true,
		tab: 'chat',
		queue: [],
	};

	componentDidMount() {
		const { authorized, history } = this.props;
		if (!authorized) return history.push('/join');
	};

	componentWillUnmount() {
		if (this.state.socket) {
			this.state.socket.removeAllListeners();
			this.props.setAuthorized(false);
		};
	};

	onSocketMethods = (socket) => {
		const { roomName, username, history } = this.props;
		const { player } = this.state;
		
		socket.on('connect', () => {
			socket.emit(JOIN, { roomName, username });
			socket.emit(GET_VIDEO_INFORMATION);
			socket.emit(GET_QUEUE);
			socket.emit(GET_INVITE_CODE);
		});

		socket.on('error', (error) => console.error(error));

		socket.on(NOTIFY_CLIENT_ERROR, (message) => notyfError(message, 5000));
		socket.on(NOTIFY_CLIENT_SUCCESS, (message) => notyfSuccess(message, 5000));

		socket.on(GET_INVITE_CODE, (inviteCode) => history.replace('/', { inviteCode }));

		socket.on(NEW_USER_JOINED, () => this.context.playUserJoinedSound());

		socket.on(PLAY, () => player.playVideo());

		socket.on(PAUSE, () => player.pauseVideo());

		socket.on(GET_HOST_TIME, () => socket.emit(SYNC_WITH_HOST));

		socket.on(SYNC_VIDEO_WITH_HOST, () => {
			socket.emit(SYNC_TIME, player.getCurrentTime());
		});

		socket.on(SYNC_TIME, (currentTime) => this.syncTime(currentTime));

		socket.on(VIDEO_CHANGED, (videoURL) => {
			player.loadVideoById({
				videoId: this.convertURLToYoutubeVideoId(videoURL)
			});
			socket.emit(SYNC_VIDEO_WITH_HOST);
		});

		socket.on(GET_VIDEO_INFORMATION, () => {
			const data = {
				videoURL: player.getVideoUrl(),
				currentTime: player.getCurrentTime()
			};
			socket.emit(SYNC_VIDEO_INFORMATION, data);
		});

		socket.on(SYNC_VIDEO_INFORMATION, (data) => {
			const videoId = this.convertURLToYoutubeVideoId(data.videoURL)
			player.loadVideoById({
				videoId,
				startSeconds: data.currentTime
			});
		});

		socket.on(MESSAGE, (data) => this.getMessages(data));

		socket.on(GET_USERS, (users) => this.setState({ users }));

		socket.on(SET_HOST, (host) => this.setState({ host }));

		socket.on(GET_QUEUE, (queue) => this.setState({ queue }));
	};

	onReady = (e) => {
		const socket = io(socketURL, {transports: ['websocket']});
		this.setState({ player: e.target, socket });
		this.onSocketMethods(socket);
		this.setState({ loading: false });
	};

	onError = (error) => console.error(error);

	convertURLToYoutubeVideoId = (url) => {
		let id = '';

		url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);

		if(url[2] !== undefined) {
			id = url[2].split(/[^0-9a-z_-]/i);
			id = id[0];
		} else id = url;

		return id;
	};

	syncTime = (currentTime) => {
		if (
			this.state.player.getCurrentTime() < currentTime - 0.5 ||
			this.state.player.getCurrentTime() > currentTime + 0.5
		) {
			this.state.player.seekTo(currentTime);
			this.state.player.playVideo();
		}
	};

	handleOnChangeVideoURL = (e) => this.setState({ videoURL: e.target.value });

	handleChangeVideo = () => {
		const { videoURL, socket } = this.state;

		if (!YOUTUBE_VIDEO_URL_REGEX.test(videoURL)) {
			return notyfError('Invalid URL', 5000);
		};
		
		socket.emit(VIDEO_CHANGED, videoURL);
	};

	handleOnKeyDown = (e) => {
    	if (e.keyCode === 13) this.handleChangeVideo();
	};

	getMessages = (data) => {
		this.setState({
			messages: [
				...this.state.messages,
				{
					username: data.username,
					content: data.content,
					type: data.type,
					id: data.id,
				},
			],
		});
	};

	addToQueue = (video) => this.state.socket.emit(ADD_TO_QUEUE, video);

	removeFromQueue = (videoId) => {
		this.state.socket.emit(REMOVE_FROM_QUEUE, videoId)
	};

	sendMessage = (message) => {
		this.state.socket.emit(SEND_MESSAGE, {
			content: message,
			username: this.props.username,
		});
	};

	handleSetNewHost = (userId) => this.state.socket.emit(SET_NEW_HOST, userId);

	onStateChanged = () => {
		const { player, socket } = this.state;

		switch (player.getPlayerState()) {
		  case -1:
			socket.emit(PLAY);
			break;
		  case 0:
			break;
		  case 1:
			socket.emit(SYNC_WITH_HOST);
			socket.emit(PLAY);
			break;
		  case 2:
			socket.emit(PAUSE);
			break;
		  case 3:
			socket.emit(SYNC_WITH_HOST);
			break;
		  case 5:
			break;
		  default:
			break;
		}
	};

	setTab = (tab) => this.setState({ tab });
	
	render() {	
		
		const { loading, messages, users, socket, host, tab, queue, videoURL } = this.state;

		return (
			<>
				{ loading && <Loading /> }
				<Tabs tab={tab} setTab={this.setTab} />
				<div className='video-room-page'>
					<div className='video-and-current-tab-container'>
						<div className='video-and-input-container' data-chatishidden={this.context.tabContentHidden}>
							<div className='embed-responsive embed-responsive-16by9'>
								<YouTube
									videoId='_hql7mO-zaA'
									opts={youtubeConfig}
									onStateChange={this.onStateChanged}
									onReady={this.onReady}
									onError={this.onError}
									className='embed-responsive'
								/>
							</div>
							<div className='change-video-input-container'>
								<input
									type='text'
									placeholder='Enter YouTube Video URL'
									pattern='https://.*'
									value={videoURL}
									onChange={this.handleOnChangeVideoURL}
									onKeyDown={this.handleOnKeyDown}
								/>
								<button onClick={this.handleChangeVideo}>Change Video</button>
							</div>
						</div>
						{
							!this.context.tabContentHidden && (
							<CurrentTab
								tab={tab}
								setTab={this.setTab}
								messages={messages}
								users={users}
								socket={socket}
								sendMessage={this.sendMessage}
								host={host}
								handleSetNewHost={this.handleSetNewHost}
								queue={queue}
								removeFromQueue={this.removeFromQueue}
								addToQueue={this.addToQueue}
								handleChangeVideo={this.handleChangeVideo}
							/>
							)}
					</div>
				</div>
			</>
		);
	}
}

export default withRouter(VideoRoom);
