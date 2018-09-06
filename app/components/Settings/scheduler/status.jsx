/* eslint-disable max-len */
import React from 'react';
import PropTypes from 'prop-types';

const Status = ({success}) => {
    if (success) {
        return (
            <svg width={12} height={12} fill="none" xmlnsXlink="http://www.w3.org/1999/xlink">
                <circle cx={6} cy={6} r={6} fill="#27AE60" />
                <rect x="2.25" y="2.25" width="7.25" height="7.625" fill="url(#b)" filter="url(#a)" />
                <defs>
                    <filter
                        id="a"
                        x="2.25"
                        y="2.25"
                        width="7.25"
                        height="7.625"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity={0} result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feOffset dy={16} />
                        <feGaussianBlur stdDeviation={3} />
                        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
                        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
                        <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
                    </filter>
                    <pattern id="b" patternContentUnits="objectBoundingBox" width={1} height={1}>
                        <use xlinkHref="#c" transform="translate(-0.0258619) scale(0.00525862 0.005)" />
                    </pattern>
                    <image
                        id="c"
                        width={200}
                        height={200}
                        xlinkHref="data:image/png;base64,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"
                    />
                </defs>
            </svg>
        );
    }

    return (
        <svg width={12} height={12} fill="none">
            <circle cx={6} cy={6} r={6} fill="#FF5E5E" />
            <path
                d="M3.748 9h1.114l1.073-1.671h.062L7.057 9h1.175l-1.6-2.468 1.624-2.464H7.1L6.06 5.794H6L4.971 4.068H3.758l1.565 2.447L3.748 9z"
                fill="#fff"
            />
        </svg>
    );
};

Status.propTypes = {
    success: PropTypes.bool
};

export default Status;
