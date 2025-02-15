<template>
  <div class="score" style="position: relative;">
    <div class="score-display">
      <div class="digit-container">
        <span :class="{ spinning: firstDigitSpinning }">{{ firstDigit !== null ? firstDigit : '' }}</span>
        <span :class="{ spinning: secondDigitSpinning }">{{ secondDigit !== null ? secondDigit : '' }}</span>
      </div>
    </div>
    <div class="message-wrapper" v-if="successMessage">
      <div class="message-text">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import drumroll3 from '../assets/sound/drumroll3.mp3';
const sound = new Audio(drumroll3);

export default {
  data() {
    return {
      firstDigit: 0,
      secondDigit: 0,
      firstDigitSpinning: true,
      secondDigitSpinning: true,
      successMessage: '',
      intervalId: null,
      messages: {
        0: ['Keep practicing, you’ll get there!', 'Better luck next time!', 'Don’t give up, try again!', 'Practice makes perfect!'],
        1: ['Not bad, but you can do better!', 'Keep singing, you’re improving!', 'You’re on the right track!', 'Almost there, keep going!'],
        2: ['Good job, you’re getting there!', 'Nice effort, keep it up!', 'You’re doing great, keep practicing!', 'Well done, keep it up!'],
        3: ['Great performance, almost a pro!', 'You’re really good, keep going!', 'Fantastic, you’re almost there!', 'You’re a natural, keep it up!'],
        4: ['Amazing, you’re a star!', 'You nailed it, fantastic job!', 'Incredible, you’re a superstar!', 'Outstanding, you’re the best!']
      }
    };
  },
  computed: {
    ...mapState(['lista'])
  },
  mounted() {
    sound.currentTime = 0;
    sound.play();
    sound.addEventListener('ended', this.onSoundEnd);
    this.changeDigits();
  },
  unmounted() {
    sound.pause();
    sound.removeEventListener('ended', this.onSoundEnd);
  },
  methods: {
    ...mapActions(['pularMusica']),
    changeDigits() {
      this.intervalId = setInterval(() => {
        this.firstDigit = Math.floor(Math.random() * 10);
        this.secondDigit = Math.floor(Math.random() * 10);
      }, 200);

      setTimeout(() => {
        clearInterval(this.intervalId);
        this.firstDigit = Math.floor(Math.random() * 10);
        this.firstDigitSpinning = false;
        this.intervalId = setInterval(() => {
          this.secondDigit = Math.floor(Math.random() * 10);
        }, 200);

        setTimeout(() => {
          clearInterval(this.intervalId);
          this.secondDigit = Math.floor(Math.random() * 10);
          this.secondDigitSpinning = false;
          this.setSuccessMessage();
        }, 2500);
      }, 2500);
    },
    setSuccessMessage() {
      const score = this.firstDigit * 10 + this.secondDigit;
      const messageIndex = Math.floor(score / 20);
      const messages = this.messages[messageIndex];
      this.successMessage = messages[Math.floor(Math.random() * messages.length)];
    },
    onSoundEnd() {
      this.pularMusica();
      if (this.lista.length > 0) {
        this.$router.push({ name: 'video' });
      } else {
        this.$router.push({ name: 'home' });
      }
    }
  }
};
</script>

<style scoped>
.score {
  text-align: center;
  background-image: url('../assets/image/backgroundimagescore2.webp');
  background-size: cover;
  background-position: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.score-display {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 226px;
  overflow: hidden;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.digit-container {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10rem;
  font-family: 'Arial Black', sans-serif;
  color: yellow;
  font-weight: bold;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
  position: relative;
}

.digit-container span {
  display: inline-block;
  width: 50%;
  text-align: center;
}

.spinning {
  animation: spin 0.2s linear infinite;
}

@keyframes spin {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(100%);
  }
}

.message-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 70%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.message-text {
  font-size: 30px;
  font-family: 'Arial', sans-serif;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
  background-color: #0a09097a;
  border-radius: 1rem;
  padding: 5px;
}
</style>