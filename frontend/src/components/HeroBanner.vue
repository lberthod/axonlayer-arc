<template>
  <div class="hero">
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        Orchestration in production
      </div>

      <h1 class="hero-title">
        <span class="line line-1">You don't use APIs.</span>
        <span class="line line-2">You <span class="highlight">fund a mission.</span></span>
      </h1>

      <p class="hero-subtitle">
        ArcAgent Hub privately executes it using a decentralized agent network.
        <br/>
        <span class="text-xs text-gray-500">Every action settled in USDC on Arc.</span>
      </p>

      <div class="hero-features">
        <div class="feature">
          <span class="feature-icon">⚡</span>
          <span>$0.0005 per task</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🔒</span>
          <span>Private execution</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🔗</span>
          <span>On-chain settlement</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 4rem 1rem 3rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(168, 85, 247, 0.02) 100%);
  border-radius: 20px;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7c3aed;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.6s ease-out 0.2s both;
}

.badge-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1.1;
  margin: 1.5rem 0;
  color: #111827;
  letter-spacing: -0.02em;
  animation: fadeIn 0.8s ease-out 0.3s both;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.2rem;
  }
}

.line {
  display: block;
  overflow: hidden;
}

.line-1 {
  animation: slideUp 0.6s ease-out 0.4s both;
}

.line-2 {
  animation: slideUp 0.6s ease-out 0.5s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.highlight {
  background: linear-gradient(135deg, #7c3aed, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin-top: 1.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  animation: fadeIn 0.8s ease-out 0.6s both;
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 2.5rem;
  animation: fadeIn 0.8s ease-out 0.7s both;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: default;
}

.feature:hover {
  border-color: #7c3aed;
  background: rgba(124, 58, 237, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
}

.feature-icon {
  font-size: 1.5rem;
  display: block;
}

.feature span:last-child {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
