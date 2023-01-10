import React from "react"

class ErrorBoundary extends React.Component {
  constructor(properties) {
    super(properties)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return <h1> An error has occurred. </h1>

    const { children } = this.props
    return children
  }
}
